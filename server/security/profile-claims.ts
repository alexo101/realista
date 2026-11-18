import { createHash, randomBytes } from "crypto";

export const PROFILE_CLAIM_TTL_HOURS = 48;
export const PROFILE_CLAIM_TTL_MS = PROFILE_CLAIM_TTL_HOURS * 60 * 60 * 1000;

export function createProfileClaimToken(now: number = Date.now()): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashProfileClaimToken(token), expiresAt: new Date(now + PROFILE_CLAIM_TTL_MS) };
}

export function hashProfileClaimToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** "juan.perez@example.com" -> "j***@example.com". Never returns the full local part. */
export function maskEmail(email: string): string {
  const [local, domain] = email.trim().split("@");
  if (!local || !domain) return "***";
  return `${local[0]}***@${domain}`;
}

export function isValidEmail(email: string | null | undefined): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type ClaimEligibilityCode =
  | "ok"
  | "already_claimed"
  | "email_missing"
  | "already_owns_agent_profile";

/** Pure eligibility rules; the caller supplies the facts it looked up. */
export function evaluateClaimEligibility(input: {
  profileType: "agent" | "agency";
  alreadyClaimed: boolean;
  targetEmail: string | null | undefined;
  requesterOwnsAgentProfile: boolean;
}): ClaimEligibilityCode {
  if (input.alreadyClaimed) return "already_claimed";
  if (input.profileType === "agent" && input.requesterOwnsAgentProfile) return "already_owns_agent_profile";
  if (!isValidEmail(input.targetEmail)) return "email_missing";
  return "ok";
}

/** Only same-origin relative paths are allowed as post-login redirects. */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}
