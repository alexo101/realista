import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createPasswordResetToken,
  createPasswordSetupToken,
  PASSWORD_RESET_TTL_MS,
  PASSWORD_SETUP_TTL_MS,
} from "./password-reset";

describe("password token lifetimes", () => {
  it("keeps reset links short-lived", () => {
    const token = createPasswordResetToken();
    const remaining = token.expiresAt.getTime() - Date.now();
    assert.ok(remaining > PASSWORD_RESET_TTL_MS - 1000);
    assert.ok(remaining <= PASSWORD_RESET_TTL_MS);
  });

  it("creates seven-day account setup links", () => {
    const token = createPasswordSetupToken();
    const remaining = token.expiresAt.getTime() - Date.now();
    assert.ok(token.token.length > 20);
    assert.ok(token.tokenHash.length === 64);
    assert.ok(remaining > PASSWORD_SETUP_TTL_MS - 1000);
    assert.ok(remaining <= PASSWORD_SETUP_TTL_MS);
  });
});
