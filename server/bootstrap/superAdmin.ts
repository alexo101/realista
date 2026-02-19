import { storage } from "../storage";

const SUPERADMIN_EMAIL_ENV = "SUPERADMIN_EMAIL";
const SUPERADMIN_PASSWORD_ENV = "SUPERADMIN_PASSWORD";
const SUPERADMIN_ROTATE_ON_BOOT_ENV = "SUPERADMIN_ROTATE_PASSWORD_ON_BOOT";

export async function ensureSuperAdminUser(): Promise<void> {
  const email = process.env[SUPERADMIN_EMAIL_ENV]?.trim().toLowerCase();
  const password = process.env[SUPERADMIN_PASSWORD_ENV];
  const rotatePasswordOnBoot = process.env[SUPERADMIN_ROTATE_ON_BOOT_ENV] === "true";

  if (!email || !password) {
    console.warn(
      `[super-admin] Skipping bootstrap. Missing ${SUPERADMIN_EMAIL_ENV} or ${SUPERADMIN_PASSWORD_ENV}.`,
    );
    return;
  }

  const existing = await storage.getUserByEmail(email);
  if (!existing) {
    await storage.createUser({
      email,
      password,
      name: "Super",
      surname: "Admin",
      agentType: "super_admin",
      isActive: true,
    });
    console.log("[super-admin] Super admin user created.");
    return;
  }

  const updates: Record<string, unknown> = {};
  if (existing.agentType !== "super_admin") {
    updates.agentType = "super_admin";
  }
  if (existing.isActive === false) {
    updates.isActive = true;
  }
  if (rotatePasswordOnBoot) {
    updates.password = password;
  }

  if (Object.keys(updates).length > 0) {
    await storage.updateUser(existing.id, updates as any);
    console.log("[super-admin] Existing account normalized.");
    return;
  }

  console.log("[super-admin] Super admin already configured.");
}
