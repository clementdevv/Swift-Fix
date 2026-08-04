const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'AUTH_SECRET',
] as const

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number]

export function getRequiredEnv(name: RequiredEnvVar): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env and add your Neon credentials.`
    )
  }
  return value
}

export function getDatabaseUrl(): string {
  return getRequiredEnv('DATABASE_URL')
}

export function getDirectDatabaseUrl(): string {
  return getRequiredEnv('DIRECT_URL')
}

export function getAuthSecret(): string {
  return getRequiredEnv('AUTH_SECRET')
}

export function getAuthUrl(): string {
  return process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || 'http://localhost:3000'
}
