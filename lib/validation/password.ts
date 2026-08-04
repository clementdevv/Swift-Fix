import { AUTH_STRINGS } from '@/lib/constants/auth'

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/`~]/

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: AUTH_STRINGS.passwordTooShort }
  }

  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return { valid: false, error: AUTH_STRINGS.passwordRequiresSpecial }
  }

  return { valid: true }
}

export function passwordsMatch(a: string, b: string): boolean {
  return a === b
}

export function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (SPECIAL_CHAR_REGEX.test(password)) strength++
  return strength
}
