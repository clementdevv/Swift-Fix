import nodemailer from 'nodemailer'
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'
import { getAuthUrl } from '@/lib/env'
import { AUTH_STRINGS } from '@/lib/constants/auth'

type EmailProvider = 'mailtrap' | 'mailersend' | 'console'

function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase()
  if (provider === 'mailtrap' || provider === 'mailersend' || provider === 'console') {
    return provider
  }
  return process.env.NODE_ENV === 'production' ? 'mailersend' : 'console'
}

function getFromAddress() {
  const email = process.env.MAIL_FROM_EMAIL?.trim() || 'noreply@briqoly.test'
  const name = process.env.MAIL_FROM_NAME?.trim() || 'Briqoly'
  return { email, name, formatted: `"${name}" <${email}>` }
}

function buildPasswordResetHtml(resetUrl: string) {
  return `
    <p>We received a request to reset your Briqoly password.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>This link expires in ${AUTH_STRINGS.passwordResetExpiryHours} hour.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `.trim()
}

function buildPasswordResetText(resetUrl: string) {
  return [
    'We received a request to reset your Briqoly password.',
    `Reset your password: ${resetUrl}`,
    `This link expires in ${AUTH_STRINGS.passwordResetExpiryHours} hour.`,
    'If you did not request this, you can ignore this email.',
  ].join('\n\n')
}

function buildPasswordResetContent(token: string) {
  const resetUrl = `${getAuthUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`
  return {
    resetUrl,
    subject: AUTH_STRINGS.passwordResetSubject,
    html: buildPasswordResetHtml(resetUrl),
    text: buildPasswordResetText(resetUrl),
  }
}

async function sendViaMailtrap({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}) {
  const host = process.env.MAILTRAP_HOST?.trim()
  const port = Number(process.env.MAILTRAP_PORT || 2525)
  const user = process.env.MAILTRAP_USER?.trim()
  const pass = process.env.MAILTRAP_PASS?.trim()

  if (!host || !user || !pass) {
    throw new Error(
      'Mailtrap is not configured. Set MAILTRAP_HOST, MAILTRAP_USER, and MAILTRAP_PASS in .env'
    )
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
  })

  const from = getFromAddress()

  await transport.sendMail({
    from: from.formatted,
    to,
    subject,
    html,
    text,
  })
}

async function sendViaMailerSend({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}) {
  const apiKey = process.env.MAILERSEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('MAILERSEND_API_KEY is not set')
  }

  const fromEmail = process.env.MAILERSEND_FROM_EMAIL?.trim() || process.env.MAIL_FROM_EMAIL?.trim()
  if (!fromEmail) {
    throw new Error('MAILERSEND_FROM_EMAIL or MAIL_FROM_EMAIL is not set')
  }

  const fromName = process.env.MAILERSEND_FROM_NAME?.trim() || process.env.MAIL_FROM_NAME?.trim() || 'Briqoly'
  const mailerSend = new MailerSend({ apiKey })

  const emailParams = new EmailParams()
    .setFrom(new Sender(fromEmail, fromName))
    .setTo([new Recipient(to)])
    .setSubject(subject)
    .setHtml(html)
    .setText(text)

  await mailerSend.email.send(emailParams)
}

function sendViaConsole({
  to,
  subject,
  resetUrl,
}: {
  to: string
  subject: string
  resetUrl: string
}) {
  console.log('\n========================================')
  console.log('  PASSWORD RESET (local dev — console)')
  console.log('========================================')
  console.log(`  To:      ${to}`)
  console.log(`  Subject: ${subject}`)
  console.log(`  Link:    ${resetUrl}`)
  console.log('========================================\n')
}

export async function sendPasswordResetEmail({
  to,
  token,
}: {
  to: string
  token: string
}) {
  const { subject, html, text, resetUrl } = buildPasswordResetContent(token)
  const provider = getEmailProvider()

  switch (provider) {
    case 'console':
      sendViaConsole({ to, subject, resetUrl })
      break
    case 'mailersend':
      await sendViaMailerSend({ to, subject, html, text })
      break
    case 'mailtrap':
    default:
      await sendViaMailtrap({ to, subject, html, text })
      break
  }
}
