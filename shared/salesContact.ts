export const SALES_EMAIL = "contacto@realista.homes";
export const SALES_PHONE = "+34 632925738";

export type SalesProfile = "agency" | "agent" | "network";

export function buildSalesMailto(input: {
  profile: SalesProfile;
  plan: string;
  billing: "monthly" | "yearly";
  language: string;
}): string {
  const subject = `Realista Pro - ${input.profile} - ${input.plan}`;
  const body = [
    "Hello Realista Sales,",
    "",
    `I would like more information about the ${input.plan} tier for a ${input.profile}.`,
    `Preferred billing: ${input.billing}.`,
    `Language: ${input.language}.`,
    "",
    "Please contact me to discuss access and pricing.",
  ].join("\n");

  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
