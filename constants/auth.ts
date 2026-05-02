export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export const ERRORS = {
  EMAIL_REQUIRED: "Por favor ingresa tu correo electrónico.",
  EMAIL_INVALID: "El correo electrónico no tiene un formato válido.",
  PASSWORD_REQUIRED: "Por favor ingresa tu contraseña.",
  PASSWORD_TOO_SHORT: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  PASSWORD_NO_NUMBER: "La contraseña debe contener al menos un número.",
  PASSWORDS_NO_MATCH: "Las contraseñas no coinciden.",
  NAME_REQUIRED: "Por favor ingresa tu nombre completo.",
  TERMS_REQUIRED: "Debes aceptar los Términos y Condiciones para continuar.",
  LOGIN_FAILED: "Correo o contraseña incorrectos.",
  NETWORK_ERROR: "Error de conexión. Verifica tu internet e intenta de nuevo.",
} as const;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return ERRORS.EMAIL_REQUIRED;
  if (!EMAIL_REGEX.test(email.trim())) return ERRORS.EMAIL_INVALID;
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return ERRORS.PASSWORD_REQUIRED;
  if (password.length < MIN_PASSWORD_LENGTH) return ERRORS.PASSWORD_TOO_SHORT;
  if (!/\d/.test(password)) return ERRORS.PASSWORD_NO_NUMBER;
  return null;
}

export function getPasswordStrength(password: string): {
  level: "weak" | "medium" | "strong";
  label: string;
  color: string;
} {
  if (password.length === 0) return { level: "weak", label: "", color: "#e2e8f0" };
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (/\d/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { level: "weak", label: "Débil", color: "#ef4444" };
  if (score === 2 || score === 3) return { level: "medium", label: "Media", color: "#f59e0b" };
  return { level: "strong", label: "Fuerte", color: "#22c55e" };
}
