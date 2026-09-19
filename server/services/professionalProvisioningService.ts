import { storage } from "../storage";

export type ProvisioningInput = {
  kind: "agency" | "agent" | "network";
  email: string;
  name: string;
  surname: string;
  plan: string;
  isYearlyBilling: boolean;
  agencyName?: string;
  city?: string;
  networkName?: string;
  billingMode?: "network" | "agency";
};

export async function provisionProfessional(input: ProvisioningInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await storage.getUserByEmail(email);
  if (existing) {
    const error = new Error("A professional account already exists for this email.");
    (error as Error & { code?: string }).code = "EMAIL_EXISTS";
    throw error;
  }

  const normalized: ProvisioningInput = {
    ...input,
    email,
    plan: input.kind === "agency"
      ? input.plan
      : input.kind === "network"
        ? "red_agencias"
        : input.plan === "lider" ? "lider" : "basico",
  };

  return storage.provisionProfessional(normalized);
}
