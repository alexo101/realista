import type { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import { hashPassword } from "./security/password";
import { getPasswordRequirementErrors } from "@shared/password-policy";
import {
  PROFILE_CLAIM_TTL_HOURS,
  createProfileClaimToken,
  evaluateClaimEligibility,
  hashProfileClaimToken,
  isValidEmail,
  maskEmail,
} from "./security/profile-claims";
import {
  ClaimConflictError,
  accountExistsForEmail,
  completeClaim,
  countRecentTokens,
  createClaimSupportRequest,
  createClaimToken,
  deleteClaimToken,
  getActiveClaim,
  getAgencyAdminAgent,
  getAgencyByUuid,
  getAgencySummaryForAgent,
  getAgentById,
  getAgentByUuid,
  getValidClaimToken,
  getVerifiedClaimsForOwner,
  getVerifiedAgentClaimForOwner,
  invalidateOpenTokens,
  listUnclaimedMemberAgents,
  ownsAgencyClaim,
  searchClaimableAgencies,
  searchClaimableAgents,
  setAgentPasswordIfUnset,
  transferAgencyClaim,
  type ProfileType,
} from "./services/profileClaimStore";
import { sendClaimSupportNotification, sendProfileClaimEmail } from "./emailService";

interface ClaimRouteDeps {
  ensureCsrfToken: (req: Request) => string;
  requireCsrfForStateChange: (req: Request, res: Response, next: NextFunction) => void;
}

// --- tiny in-memory rate limiter -------------------------------------------
const buckets = new Map<string, number[]>();

function rateLimit(name: string, max: number, windowMs: number, keyFn?: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${name}:${keyFn ? keyFn(req) : req.ip || "unknown"}`;
    const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
    if (hits.length >= max) {
      res.status(429).json({ code: "rate_limited", message: "Demasiadas solicitudes. Inténtalo de nuevo más tarde." });
      return;
    }
    hits.push(now);
    buckets.set(key, hits);
    if (buckets.size > 5000) {
      for (const [k, v] of Array.from(buckets.entries())) {
        if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
      }
    }
    next();
  };
}

const ERROR_MESSAGES: Record<string, string> = {
  profile_not_found: "No hemos encontrado ese perfil.",
  already_claimed: "Este perfil ya ha sido reclamado.",
  already_owns_agent_profile: "Tu cuenta ya tiene un perfil de agente reclamado.",
  email_missing: "No tenemos un email profesional válido para este perfil.",
  delivery_failed: "No hemos podido enviar el email de verificación.",
  invalid_token: "Este enlace ha caducado o ya no es válido.",
  agent_account_required: "Para reclamar una agencia debes iniciar sesión con una cuenta de agente.",
};

function fail(res: Response, status: number, code: string, extra: Record<string, unknown> = {}) {
  return res.status(status).json({ code, message: ERROR_MESSAGES[code] || code, ...extra });
}

async function resolveProfile(type: ProfileType, uuid: string) {
  if (type === "agent") {
    const agent = await getAgentByUuid(uuid);
    if (!agent || agent.agentType === "super_admin") return undefined;
    const label = [agent.name, agent.surname].filter(Boolean).join(" ") || "Agente";
    return { id: agent.id, label, email: agent.email as string | null, agencyName: (await getAgencySummaryForAgent(agent.id))?.agencyName ?? null };
  }
  const agency = await getAgencyByUuid(uuid);
  if (!agency) return undefined;
  const admin = await getAgencyAdminAgent(agency.id);
  return { id: agency.id, label: agency.agencyName, email: admin?.email ?? null, agencyName: null as string | null };
}

function sessionOwner(req: Request): { type: "agent" | "client"; id: number } | null {
  const user = (req as any).session?.user as { id: number; isClient: boolean } | undefined;
  if (!user) return null;
  return { type: user.isClient ? "client" : "agent", id: user.id };
}

export function registerClaimRoutes(app: Express, deps: ClaimRouteDeps) {
  const { ensureCsrfToken, requireCsrfForStateChange } = deps;

  // ---- Search (public; never returns emails) ------------------------------
  app.get(
    "/api/claims/search",
    rateLimit("claim-search", 60, 60_000),
    async (req, res) => {
      const parsed = z
        .object({ type: z.enum(["agent", "agency"]), q: z.string().trim().min(2).max(100) })
        .safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ code: "invalid_query", message: "Escribe al menos 2 caracteres." });
      }
      try {
        const results =
          parsed.data.type === "agent"
            ? await searchClaimableAgents(parsed.data.q)
            : await searchClaimableAgencies(parsed.data.q);
        res.json({ results });
      } catch (error) {
        console.error("Error searching claimable profiles:", error);
        res.status(500).json({ message: "No se pudo realizar la búsqueda." });
      }
    },
  );

  // ---- Request a verification email ---------------------------------------
  app.post(
    "/api/claims/request",
    rateLimit("claim-request-ip", 10, 15 * 60_000),
    async (req, res) => {
      const parsed = z
        .object({ type: z.enum(["agent", "agency"]), profileUuid: z.string().uuid() })
        .safeParse(req.body);
      if (!parsed.success) return fail(res, 400, "profile_not_found");

      try {
        const { type, profileUuid } = parsed.data;
        const profile = await resolveProfile(type, profileUuid);
        if (!profile) return fail(res, 404, "profile_not_found");

        const owner = sessionOwner(req);
        const [claim, ownedAgentClaim, recent] = await Promise.all([
          getActiveClaim(type, profile.id),
          owner && type === "agent" ? getVerifiedAgentClaimForOwner(owner.type, owner.id) : Promise.resolve(undefined),
          countRecentTokens(type, profile.id, new Date(Date.now() - 60 * 60_000)),
        ]);

        const eligibility = evaluateClaimEligibility({
          profileType: type,
          alreadyClaimed: Boolean(claim),
          targetEmail: profile.email,
          requesterOwnsAgentProfile: Boolean(ownedAgentClaim),
        });
        if (eligibility !== "ok") {
          return fail(res, eligibility === "email_missing" ? 422 : 409, eligibility);
        }
        if (recent >= 3) {
          return res.status(429).json({ code: "rate_limited", message: "Ya hemos enviado varios enlaces para este perfil. Revisa tu bandeja de entrada o inténtalo más tarde." });
        }

        const targetEmail = profile.email as string;
        await invalidateOpenTokens(type, profile.id);
        const created = createProfileClaimToken();
        const row = await createClaimToken({
          tokenHash: created.tokenHash,
          profileType: type,
          profileId: profile.id,
          sentToEmail: targetEmail.trim().toLowerCase(),
          origin: "self",
          expiresAt: created.expiresAt,
          requesterIp: req.ip,
        });

        const sent = await sendProfileClaimEmail({
          to: targetEmail.trim(),
          token: created.token,
          profileType: type,
          profileName: profile.label,
          origin: "self",
          agencyName: profile.agencyName,
          ttlHours: PROFILE_CLAIM_TTL_HOURS,
        });
        if (!sent) {
          await deleteClaimToken(row.id);
          return fail(res, 502, "delivery_failed");
        }

        res.json({ sent: true, maskedEmail: maskEmail(targetEmail) });
      } catch (error) {
        console.error("Error requesting profile claim:", error);
        res.status(500).json({ code: "delivery_failed", message: ERROR_MESSAGES.delivery_failed });
      }
    },
  );

  // ---- Validate a link ----------------------------------------------------
  app.get("/api/claims/token/:token", rateLimit("claim-token", 60, 60_000), async (req, res) => {
    try {
      const token = await getValidClaimToken(hashProfileClaimToken(String(req.params.token || "")));
      if (!token) return fail(res, 400, "invalid_token");

      let label = "";
      let agencyName: string | null = null;
      if (token.profileType === "agent") {
        const agent = await getAgentById(token.profileId);
        label = [agent?.name, agent?.surname].filter(Boolean).join(" ") || "Agente";
        agencyName = agent ? (await getAgencySummaryForAgent(agent.id))?.agencyName ?? null : null;
      } else {
        const agency = await storage.getAgencyById(token.profileId);
        label = agency?.agencyName || "Agencia";
      }

      res.json({
        valid: true,
        profileType: token.profileType,
        profileName: label,
        agencyName,
        origin: token.origin,
        maskedEmail: maskEmail(token.sentToEmail),
        emailHasAccount: await accountExistsForEmail(token.sentToEmail),
        expiresAt: token.expiresAt,
      });
    } catch (error) {
      console.error("Error validating claim token:", error);
      fail(res, 400, "invalid_token");
    }
  });

  // ---- Create an account from the claim link ------------------------------
  // The link proves control of the professional mailbox, so the passwordless
  // profile row can safely receive its first password. If an account already
  // exists for that email we never create a duplicate: the UI switches to login.
  app.post("/api/claims/register", rateLimit("claim-register", 10, 15 * 60_000), async (req, res) => {
    const parsed = z
      .object({ token: z.string().min(1), password: z.string().min(1), confirmPassword: z.string().min(1) })
      .refine((d) => d.password === d.confirmPassword, { message: "Las contraseñas no coinciden.", path: ["confirmPassword"] })
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Datos no válidos." });
    }
    const passwordErrors = getPasswordRequirementErrors(parsed.data.password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ message: `La contraseña debe incluir ${passwordErrors.join(", ")}.` });
    }

    try {
      const token = await getValidClaimToken(hashProfileClaimToken(parsed.data.token));
      if (!token) return fail(res, 400, "invalid_token");

      if (await accountExistsForEmail(token.sentToEmail)) {
        return res.status(409).json({ code: "account_exists", message: "Ya existe una cuenta de Realista con este correo. Inicia sesión para continuar." });
      }

      const user = await storage.getUserByEmail(token.sentToEmail);
      if (!user) return fail(res, 400, "invalid_token");

      const updated = await setAgentPasswordIfUnset(user.id, await hashPassword(parsed.data.password));
      if (!updated) {
        return res.status(409).json({ code: "account_exists", message: "Ya existe una cuenta de Realista con este correo. Inicia sesión para continuar." });
      }

      const role = await storage.getAgentRole(user.id);
      let agencyName: string | null = null;
      let subscriptionPlan: string | null = user.subscriptionPlan || null;
      if (role.agencyId) {
        const agency = await storage.getAgencyById(role.agencyId);
        agencyName = agency?.agencyName ?? null;
        subscriptionPlan = agency?.subscriptionPlan ?? null;
      }
      const isAdmin = role.role === "admin" || user.agentType === "network_admin";
      await new Promise<void>((resolve, reject) => {
        (req as any).session.regenerate((err: any) => (err ? reject(err) : resolve()));
      });
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        isAdmin,
        isClient: false,
        phone: user.phone,
        agencyId: role.agencyId,
        agencyName,
        subscriptionPlan,
        agentType: user.agentType || null,
        networkId: user.networkId || null,
        agentUuid: user.uuid,
      };
      const csrfToken = ensureCsrfToken(req);
      await new Promise<void>((resolve, reject) => {
        (req as any).session.save((err: any) => (err ? reject(err) : resolve()));
      });
      await storage.touchAgentLastLogin(user.id);

      res.json({ success: true, csrfToken });
    } catch (error) {
      console.error("Error registering from claim link:", error);
      res.status(500).json({ message: "No se pudo crear la cuenta." });
    }
  });

  // ---- Complete the claim (authenticated) ---------------------------------
  app.post(
    "/api/claims/complete",
    requireAuth,
    requireCsrfForStateChange,
    rateLimit("claim-complete", 20, 15 * 60_000),
    async (req, res) => {
      const rawToken = typeof req.body?.token === "string" ? req.body.token : "";
      if (!rawToken) return fail(res, 400, "invalid_token");
      const tokenHash = hashProfileClaimToken(rawToken);

      try {
        const user = req.user!;
        const owner = { type: (user.isClient ? "client" : "agent") as "agent" | "client", id: user.id };

        const pending = await getValidClaimToken(tokenHash);
        if (!pending) {
          return fail(res, 400, "invalid_token");
        }
        if (pending.profileType === "agency" && owner.type !== "agent") {
          return fail(res, 403, "agent_account_required");
        }

        const { claim, token } = await completeClaim(tokenHash, owner);

        let invited = 0;
        if (token.profileType === "agency") {
          invited = await inviteAgencyMembers(token.profileId);
        }

        await storage.createAdminAuditLog({
          actorId: owner.type === "agent" ? owner.id : null,
          actorEmail: user.email,
          action: "profile_claimed",
          targetType: token.profileType,
          targetId: String(token.profileId),
          afterState: { claimId: claim.id, ownerType: owner.type, ownerId: owner.id },
          metadata: { origin: token.origin, invitedAgents: invited },
        } as any).catch((e: unknown) => console.error("Audit log failed:", e));

        res.json({ success: true, profileType: token.profileType, invitedAgents: invited });
      } catch (error) {
        if (error instanceof ClaimConflictError) {
          return fail(res, error.code === "invalid_token" ? 400 : 409, error.code);
        }
        console.error("Error completing profile claim:", error);
        res.status(500).json({ message: "No se pudo completar la reclamación." });
      }
    },
  );

  // ---- Support fallback ---------------------------------------------------
  app.post("/api/claims/support", rateLimit("claim-support", 5, 60 * 60_000), async (req, res) => {
    const parsed = z
      .object({
        kind: z.enum(["missing_profile", "email_missing_or_outdated", "delivery_failed", "already_claimed"]),
        profileType: z.enum(["agent", "agency"]).optional().nullable(),
        profileUuid: z.string().uuid().optional().nullable(),
        contactName: z.string().trim().min(1).max(120),
        contactEmail: z.string().trim().email().max(200),
        message: z.string().trim().max(2000).optional().nullable(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Revisa los datos del formulario." });
    }
    try {
      const d = parsed.data;
      let profileId: number | null = null;
      let profileLabel: string | null = null;
      if (d.profileType && d.profileUuid) {
        const profile = await resolveProfile(d.profileType, d.profileUuid);
        profileId = profile?.id ?? null;
        profileLabel = profile ? `${d.profileType}: ${profile.label}` : null;
      }
      await createClaimSupportRequest({
        kind: d.kind,
        profileType: d.profileType ?? null,
        profileId,
        contactName: d.contactName,
        contactEmail: d.contactEmail,
        message: d.message ?? null,
      });
      // Persisted first; the notification email is best-effort.
      await sendClaimSupportNotification({
        kind: d.kind,
        contactName: d.contactName,
        contactEmail: d.contactEmail,
        profileLabel,
        message: d.message,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving claim support request:", error);
      res.status(500).json({ message: "No se pudo enviar la solicitud." });
    }
  });

  // ---- Current user's claims ----------------------------------------------
  app.get("/api/claims/mine", requireAuth, async (req, res) => {
    try {
      const owner = sessionOwner(req)!;
      const claims = await getVerifiedClaimsForOwner(owner.type, owner.id);
      res.json({
        agentProfileClaimed: claims.some((c) => c.profileType === "agent"),
        agencyIds: claims.filter((c) => c.profileType === "agency").map((c) => c.agencyId),
      });
    } catch (error) {
      console.error("Error loading claims:", error);
      res.status(500).json({ message: "No se pudieron cargar las reclamaciones." });
    }
  });

  // ---- Ownership transfer -------------------------------------------------
  // Moves agency ownership and the admin role to another active member.
  // The individual agent profiles of both people are left untouched.
  app.post(
    "/api/claims/agency/:uuid/transfer",
    requireAuth,
    requireCsrfForStateChange,
    async (req, res) => {
      const parsed = z.object({ newAdminAgentId: z.number().int().positive() }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Datos no válidos." });

      try {
        const user = req.user!;
        const agency = await getAgencyByUuid(String(req.params.uuid));
        if (!agency) return fail(res, 404, "profile_not_found");

        const isSuperAdmin = user.agentType === "super_admin";
        const isOwner = !user.isClient && (await ownsAgencyClaim("agent", user.id, agency.id));
        if (!isSuperAdmin && !isOwner) {
          return res.status(403).json({ message: "Solo el propietario de la agencia puede transferirla." });
        }

        const newAdminId = parsed.data.newAdminAgentId;
        const target = await getAgentById(newAdminId);
        const targetRole = target ? await storage.getAgentRole(newAdminId) : null;
        if (!target || !target.isActive || targetRole?.agencyId !== agency.id) {
          return res.status(400).json({ message: "El nuevo administrador debe ser un agente activo de la agencia." });
        }

        const currentAdmin = await getAgencyAdminAgent(agency.id);
        if (currentAdmin && currentAdmin.id !== newAdminId) {
          await storage.transferAgencyAdmin(agency.id, currentAdmin.id, newAdminId, user.id);
        }
        const claim = await transferAgencyClaim(agency.id, newAdminId);

        await storage.createAdminAuditLog({
          actorId: user.isClient ? null : user.id,
          actorEmail: user.email,
          action: "agency_claim_transferred",
          targetType: "agency",
          targetId: String(agency.id),
          afterState: { claimId: claim.id, newOwnerAgentId: newAdminId },
        } as any).catch((e: unknown) => console.error("Audit log failed:", e));

        res.json({ success: true });
      } catch (error) {
        console.error("Error transferring agency claim:", error);
        res.status(500).json({ message: "No se pudo transferir la agencia." });
      }
    },
  );
}

/** Sends an individual-profile claim link to every unclaimed non-admin agent of the agency. */
async function inviteAgencyMembers(agencyId: number): Promise<number> {
  const agency = await storage.getAgencyById(agencyId);
  const members = await listUnclaimedMemberAgents(agencyId);
  let sentCount = 0;
  for (const member of members) {
    if (!isValidEmail(member.email)) continue;
    try {
      const created = createProfileClaimToken();
      const row = await createClaimToken({
        tokenHash: created.tokenHash,
        profileType: "agent",
        profileId: member.id,
        sentToEmail: member.email.trim().toLowerCase(),
        origin: "agency_invite",
        expiresAt: created.expiresAt,
      });
      const sent = await sendProfileClaimEmail({
        to: member.email.trim(),
        token: created.token,
        profileType: "agent",
        profileName: [member.name, member.surname].filter(Boolean).join(" ") || "Agente",
        origin: "agency_invite",
        agencyName: agency?.agencyName ?? null,
        ttlHours: PROFILE_CLAIM_TTL_HOURS,
      });
      if (sent) sentCount++;
      else await deleteClaimToken(row.id);
    } catch (error) {
      console.error("Error inviting agency member to claim profile:", error);
    }
  }
  return sentCount;
}
