export const AUTH_STRINGS = {
  passwordResetSubject: 'Reset your Briqoly password',
  passwordResetExpiryHours: 1,
  forgotPasswordSuccess:
    'If an account exists for this email, you will receive password reset instructions shortly.',
  resetPasswordSuccess: 'Your password has been updated. You can now sign in.',
  invalidResetToken: 'This reset link is invalid or has expired. Please request a new one.',
  passwordsDoNotMatch: "Passwords don't match",
  passwordTooShort: 'Password must be at least 8 characters',
  passwordRequiresSpecial:
    'Password must include at least one special character (!@#$...)',
  passwordSameAsOld: 'New password must be different from your current password',
} as const
