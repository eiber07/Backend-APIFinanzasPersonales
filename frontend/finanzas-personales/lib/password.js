export const PASSWORD_RULES = [
  { id: "length", label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { id: "upper", label: "Una mayúscula", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Una minúscula", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "Un número", test: (p) => /\d/.test(p) },
];

export function isPasswordValid(password) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}