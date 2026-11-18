import { and, eq, gt, ilike, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "../db";
import {
  agencies,
  agencyAgents,
  agents,
  clients,
  networks,
  profileClaimSupportRequests,
  profileClaimTokens,
  profileClaims,
  type ProfileClaim,
  type ProfileClaimToken,
} from "@shared/schema";

export type ProfileType = "agent" | "agency";
export type OwnerType = "agent" | "client";

export class ClaimConflictError extends Error {
  constructor(public code: "already_claimed" | "already_owns_agent_profile" | "invalid_token" | "not_eligible") {
    super(code);
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Active claim = status 'verified'. */
async function activeClaimWhere(type: ProfileType, id: number) {
  return and(
    eq(profileClaims.profileType, type),
    eq(profileClaims.status, "verified"),
    type === "agent" ? eq(profileClaims.agentId, id) : eq(profileClaims.agencyId, id),
  );
}

export async function getActiveClaim(type: ProfileType, id: number): Promise<ProfileClaim | undefined> {
  const [claim] = await db.select().from(profileClaims).where(await activeClaimWhere(type, id)).limit(1);
  return claim;
}

export async function getVerifiedAgentClaimForOwner(
  ownerType: OwnerType,
  ownerId: number,
): Promise<ProfileClaim | undefined> {
  const [claim] = await db
    .select()
    .from(profileClaims)
    .where(
      and(
        eq(profileClaims.profileType, "agent"),
        eq(profileClaims.status, "verified"),
        eq(profileClaims.ownerUserType, ownerType),
        eq(profileClaims.ownerUserId, ownerId),
      ),
    )
    .limit(1);
  return claim;
}

export async function getVerifiedClaimsForOwner(ownerType: OwnerType, ownerId: number): Promise<ProfileClaim[]> {
  return db
    .select()
    .from(profileClaims)
    .where(
      and(
        eq(profileClaims.status, "verified"),
        eq(profileClaims.ownerUserType, ownerType),
        eq(profileClaims.ownerUserId, ownerId),
      ),
    );
}

export async function ownsAgencyClaim(ownerType: OwnerType, ownerId: number, agencyId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: profileClaims.id })
    .from(profileClaims)
    .where(
      and(
        eq(profileClaims.profileType, "agency"),
        eq(profileClaims.agencyId, agencyId),
        eq(profileClaims.status, "verified"),
        eq(profileClaims.ownerUserType, ownerType),
        eq(profileClaims.ownerUserId, ownerId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function searchClaimableAgents(q: string, limit = 20) {
  const pattern = `%${escapeLike(q.trim())}%`;
  const rows = await db
    .select({
      id: agents.id,
      uuid: agents.uuid,
      name: agents.name,
      surname: agents.surname,
      avatar: agents.avatar,
      city: agents.city,
      agencyName: agencies.agencyName,
      agencySlug: agencies.slug,
    })
    .from(agents)
    .leftJoin(
      agencyAgents,
      and(eq(agencyAgents.agentId, agents.id), isNull(agencyAgents.leftAt)),
    )
    .leftJoin(agencies, and(eq(agencies.id, agencyAgents.agencyId), isNull(agencies.deletedAt)))
    .where(
      and(
        isNull(agents.deletedAt),
        eq(agents.isActive, true),
        ne(agents.agentType, "super_admin"),
        sql`concat_ws(' ', ${agents.name}, ${agents.surname}) ILIKE ${pattern}`,
      ),
    )
    .orderBy(agents.name, agents.surname)
    .limit(limit);

  const claimed = await getClaimedIds("agent", rows.map((r) => r.id));
  return rows.map(({ id, ...rest }) => ({ ...rest, claimed: claimed.has(id) }));
}

export async function searchClaimableAgencies(q: string, limit = 20) {
  const pattern = `%${escapeLike(q.trim())}%`;
  const rows = await db
    .select({
      id: agencies.id,
      uuid: agencies.uuid,
      agencyName: agencies.agencyName,
      city: agencies.city,
      agencyAddress: agencies.agencyAddress,
      agencyLogo: agencies.agencyLogo,
      networkName: networks.name,
      networkSlug: networks.slug,
    })
    .from(agencies)
    .leftJoin(networks, and(eq(networks.id, agencies.networkId), isNull(networks.deletedAt)))
    .where(and(isNull(agencies.deletedAt), ilike(agencies.agencyName, pattern)))
    .orderBy(agencies.agencyName)
    .limit(limit);

  const claimed = await getClaimedIds("agency", rows.map((r) => r.id));
  return rows.map(({ id, ...rest }) => ({ ...rest, claimed: claimed.has(id) }));
}

async function getClaimedIds(type: ProfileType, ids: number[]): Promise<Set<number>> {
  if (ids.length === 0) return new Set();
  const col = type === "agent" ? profileClaims.agentId : profileClaims.agencyId;
  const rows = await db
    .select({ id: col })
    .from(profileClaims)
    .where(and(eq(profileClaims.profileType, type), eq(profileClaims.status, "verified"), inArray(col, ids)));
  return new Set(rows.map((r) => r.id as number));
}

export async function getAgentByUuid(uuid: string) {
  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.uuid, uuid), isNull(agents.deletedAt)))
    .limit(1);
  return agent;
}

export async function getAgencyByUuid(uuid: string) {
  const [agency] = await db
    .select()
    .from(agencies)
    .where(and(eq(agencies.uuid, uuid), isNull(agencies.deletedAt)))
    .limit(1);
  return agency;
}

export async function getAgencyAdminAgent(agencyId: number) {
  const [row] = await db
    .select({ agent: agents })
    .from(agencyAgents)
    .innerJoin(agents, eq(agents.id, agencyAgents.agentId))
    .where(
      and(
        eq(agencyAgents.agencyId, agencyId),
        eq(agencyAgents.role, "admin"),
        isNull(agencyAgents.leftAt),
        isNull(agents.deletedAt),
      ),
    )
    .limit(1);
  return row?.agent;
}

/** Active, non-admin members of an agency whose individual profile is unclaimed. */
export async function listUnclaimedMemberAgents(agencyId: number) {
  const members = await db
    .select({ agent: agents })
    .from(agencyAgents)
    .innerJoin(agents, eq(agents.id, agencyAgents.agentId))
    .where(
      and(
        eq(agencyAgents.agencyId, agencyId),
        eq(agencyAgents.role, "member"),
        isNull(agencyAgents.leftAt),
        isNull(agents.deletedAt),
        eq(agents.isActive, true),
      ),
    );
  if (members.length === 0) return [];
  const claimed = await getClaimedIds("agent", members.map((m) => m.agent.id));
  return members.map((m) => m.agent).filter((a) => !claimed.has(a.id) && a.email);
}

export async function getAgencySummaryForAgent(agentId: number) {
  const [row] = await db
    .select({ agencyName: agencies.agencyName, agencySlug: agencies.slug })
    .from(agencyAgents)
    .innerJoin(agencies, eq(agencies.id, agencyAgents.agencyId))
    .where(and(eq(agencyAgents.agentId, agentId), isNull(agencyAgents.leftAt)))
    .limit(1);
  return row;
}

export async function accountExistsForEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const [agent] = await db
    .select({ id: agents.id, password: agents.password })
    .from(agents)
    .where(sql`lower(${agents.email}) = ${normalized}`)
    .limit(1);
  if (agent?.password) return true;
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(sql`lower(${clients.email}) = ${normalized}`, sql`${clients.password} IS NOT NULL`))
    .limit(1);
  return Boolean(client);
}

export async function createClaimToken(data: {
  tokenHash: string;
  profileType: ProfileType;
  profileId: number;
  sentToEmail: string;
  origin: "self" | "agency_invite";
  expiresAt: Date;
  requesterIp?: string | null;
}): Promise<ProfileClaimToken> {
  const [token] = await db
    .insert(profileClaimTokens)
    .values({ ...data, requesterIp: data.requesterIp ?? null })
    .returning();
  return token;
}

/** Marks every still-open token for this profile as used (e.g. when a new link is requested or the profile is claimed). */
export async function invalidateOpenTokens(type: ProfileType, id: number): Promise<void> {
  await db
    .update(profileClaimTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(profileClaimTokens.profileType, type),
        eq(profileClaimTokens.profileId, id),
        isNull(profileClaimTokens.usedAt),
      ),
    );
}

export async function deleteClaimToken(id: number): Promise<void> {
  await db.delete(profileClaimTokens).where(eq(profileClaimTokens.id, id));
}

export async function countRecentTokens(type: ProfileType, id: number, since: Date): Promise<number> {
  const rows = await db
    .select({ id: profileClaimTokens.id })
    .from(profileClaimTokens)
    .where(
      and(
        eq(profileClaimTokens.profileType, type),
        eq(profileClaimTokens.profileId, id),
        gt(profileClaimTokens.createdAt, since),
      ),
    );
  return rows.length;
}

export async function getValidClaimToken(tokenHash: string): Promise<ProfileClaimToken | undefined> {
  const [token] = await db
    .select()
    .from(profileClaimTokens)
    .where(
      and(
        eq(profileClaimTokens.tokenHash, tokenHash),
        isNull(profileClaimTokens.usedAt),
        gt(profileClaimTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!token) return undefined;
  // A token is only valid while its profile is still unclaimed.
  const claim = await getActiveClaim(token.profileType as ProfileType, token.profileId);
  return claim ? undefined : token;
}

/**
 * Atomically consumes the token and records the verified claim for the owner.
 * Unique indexes guarantee one owner per profile and one agent-profile claim per account.
 */
export async function completeClaim(
  tokenHash: string,
  owner: { type: OwnerType; id: number },
): Promise<{ claim: ProfileClaim; token: ProfileClaimToken }> {
  try {
    return await db.transaction(async (tx) => {
      const [token] = await tx
        .update(profileClaimTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(profileClaimTokens.tokenHash, tokenHash),
            isNull(profileClaimTokens.usedAt),
            gt(profileClaimTokens.expiresAt, new Date()),
          ),
        )
        .returning();
      if (!token) throw new ClaimConflictError("invalid_token");

      const type = token.profileType as ProfileType;
      const existing = await tx
        .select({ id: profileClaims.id })
        .from(profileClaims)
        .where(await activeClaimWhere(type, token.profileId))
        .limit(1);
      if (existing.length > 0) throw new ClaimConflictError("already_claimed");

      if (type === "agent") {
        const own = await tx
          .select({ id: profileClaims.id })
          .from(profileClaims)
          .where(
            and(
              eq(profileClaims.profileType, "agent"),
              eq(profileClaims.status, "verified"),
              eq(profileClaims.ownerUserType, owner.type),
              eq(profileClaims.ownerUserId, owner.id),
            ),
          )
          .limit(1);
        if (own.length > 0) throw new ClaimConflictError("already_owns_agent_profile");
      }

      const [claim] = await tx
        .insert(profileClaims)
        .values({
          profileType: type,
          agentId: type === "agent" ? token.profileId : null,
          agencyId: type === "agency" ? token.profileId : null,
          ownerUserType: owner.type,
          ownerUserId: owner.id,
          status: "verified",
        })
        .returning();

      // Other pending links for this profile are no longer usable.
      await tx
        .update(profileClaimTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(profileClaimTokens.profileType, type),
            eq(profileClaimTokens.profileId, token.profileId),
            isNull(profileClaimTokens.usedAt),
          ),
        );

      return { claim, token };
    });
  } catch (error: any) {
    if (error instanceof ClaimConflictError) throw error;
    // Unique-index violation from a concurrent claim.
    if (error?.code === "23505") {
      const detail = String(error?.constraint || "");
      throw new ClaimConflictError(
        detail.includes("owner_agent_profile") ? "already_owns_agent_profile" : "already_claimed",
      );
    }
    throw error;
  }
}

/** Transfers agency ownership to another admin agent account. */
export async function transferAgencyClaim(agencyId: number, newOwnerAgentId: number): Promise<ProfileClaim> {
  return db.transaction(async (tx) => {
    await tx
      .update(profileClaims)
      .set({ status: "transferred", revokedAt: new Date() })
      .where(
        and(
          eq(profileClaims.profileType, "agency"),
          eq(profileClaims.agencyId, agencyId),
          eq(profileClaims.status, "verified"),
        ),
      );
    const [claim] = await tx
      .insert(profileClaims)
      .values({
        profileType: "agency",
        agencyId,
        ownerUserType: "agent",
        ownerUserId: newOwnerAgentId,
        status: "verified",
      })
      .returning();
    return claim;
  });
}

export async function createClaimSupportRequest(data: {
  kind: "missing_profile" | "email_missing_or_outdated" | "delivery_failed" | "already_claimed";
  profileType?: ProfileType | null;
  profileId?: number | null;
  contactName: string;
  contactEmail: string;
  message?: string | null;
}) {
  const [row] = await db
    .insert(profileClaimSupportRequests)
    .values({
      kind: data.kind,
      profileType: data.profileType ?? null,
      profileId: data.profileId ?? null,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      message: data.message ?? null,
    })
    .returning();
  return row;
}

export async function setAgentPasswordIfUnset(agentId: number, passwordHash: string): Promise<boolean> {
  const updated = await db
    .update(agents)
    .set({ password: passwordHash })
    .where(and(eq(agents.id, agentId), isNull(agents.password)))
    .returning({ id: agents.id });
  return updated.length > 0;
}

export async function getAgentById(id: number) {
  const [agent] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return agent;
}

export async function getAgencyIdsClaimedByAgent(agentId: number): Promise<number[]> {
  const rows = await db
    .select({ agencyId: profileClaims.agencyId })
    .from(profileClaims)
    .where(
      and(
        eq(profileClaims.profileType, "agency"),
        eq(profileClaims.status, "verified"),
        eq(profileClaims.ownerUserType, "agent"),
        eq(profileClaims.ownerUserId, agentId),
      ),
    );
  return rows.map((r) => r.agencyId as number);
}
