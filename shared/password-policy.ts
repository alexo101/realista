export const PASSWORD_REQUIREMENTS = [
  { key: "length", label: "al menos 8 caracteres", test: (password: string) => password.length >= 8 },
  { key: "uppercase", label: "una mayúscula", test: (password: string) => /[A-Z]/.test(password) },
  { key: "lowercase", label: "una minúscula", test: (password: string) => /[a-z]/.test(password) },
  { key: "number", label: "un número", test: (password: string) => /\d/.test(password) },
  {
    key: "special",
    label: "un carácter especial",
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
] as const;

export function getPasswordRequirementErrors(password: string): string[] {
  return PASSWORD_REQUIREMENTS
    .filter((requirement) => !requirement.test(password))
    .map((requirement) => requirement.label);
}

export function isStrongPassword(password: string): boolean {
  return getPasswordRequirementErrors(password).length === 0;
}
