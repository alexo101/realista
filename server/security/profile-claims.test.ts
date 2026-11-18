import assert from "node:assert/strict";
import test from "node:test";
import {
  PROFILE_CLAIM_TTL_MS,
  createProfileClaimToken,
  evaluateClaimEligibility,
  hashProfileClaimToken,
  maskEmail,
  safeNextPath,
} from "./profile-claims";

test("claim tokens are unique, hashed and expire in 48h", () => {
  const now = Date.now();
  const a = createProfileClaimToken(now);
  const b = createProfileClaimToken(now);
  assert.notEqual(a.token, b.token);
  assert.equal(a.tokenHash, hashProfileClaimToken(a.token));
  assert.notEqual(a.tokenHash, a.token);
  assert.equal(a.expiresAt.getTime(), now + PROFILE_CLAIM_TTL_MS);
  assert.ok(a.token.length >= 43);
});

test("maskEmail never reveals the full local part", () => {
  assert.equal(maskEmail("juan.perez@example.com"), "j***@example.com");
  assert.equal(maskEmail("nope"), "***");
});

test("eligibility rules", () => {
  const base = { profileType: "agent" as const, alreadyClaimed: false, targetEmail: "a@b.co", requesterOwnsAgentProfile: false };
  assert.equal(evaluateClaimEligibility(base), "ok");
  assert.equal(evaluateClaimEligibility({ ...base, alreadyClaimed: true }), "already_claimed");
  assert.equal(evaluateClaimEligibility({ ...base, targetEmail: null }), "email_missing");
  assert.equal(evaluateClaimEligibility({ ...base, targetEmail: "bad" }), "email_missing");
  assert.equal(evaluateClaimEligibility({ ...base, requesterOwnsAgentProfile: true }), "already_owns_agent_profile");
  // Owning an individual agent profile never blocks an agency claim (independent ownership).
  assert.equal(
    evaluateClaimEligibility({ ...base, profileType: "agency", requesterOwnsAgentProfile: true }),
    "ok",
  );
});

test("safeNextPath only allows same-origin relative paths", () => {
  assert.equal(safeNextPath("/reclamar-perfil/abc"), "/reclamar-perfil/abc");
  assert.equal(safeNextPath("//evil.com"), null);
  assert.equal(safeNextPath("https://evil.com"), null);
  assert.equal(safeNextPath("/\\evil.com"), null);
  assert.equal(safeNextPath(null), null);
});
