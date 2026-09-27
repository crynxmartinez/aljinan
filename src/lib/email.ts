import { Resend } from 'resend'
import { translations, getDirection, type Locale } from '@/lib/i18n/translations'

const resend = new Resend(process.env.RESEND_API_KEY || '')

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}


/** Wraps templated content in the shared header/footer chrome, honoring the email's direction. */
function renderEmailShell(locale: Locale, title: string, bodyHtml: string): string {
  const dir = getDirection(locale)
  const align = dir === 'rtl' ? 'right' : 'left'
  return `
    <!DOCTYPE html>
    <html dir="${dir}" lang="${locale}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body dir="${dir}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Tahoma, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; text-align: ${align};">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${title}</h1>
        </div>
        <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          ${bodyHtml}
        </div>
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          <p>${translations[locale].email.footer.replace('{year}', String(new Date().getFullYear()))}</p>
        </div>
      </body>
    </html>
  `
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string,
  userType: 'CONTRACTOR' | 'CLIENT' = 'CONTRACTOR',
  locale: Locale = 'ar'
) {
  const t = translations[locale].email.verification
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.tasheel.live'}/verify-email?token=${encodeURIComponent(verificationToken)}&locale=${locale}`
  const accountType = userType === 'CONTRACTOR' ? t.accountTypeContractor : t.accountTypeClient

  try {
    const result = await resend.emails.send({
      from: 'Tasheel <info@tasheel.live>',
      to: email,
      subject: t.subject,
      html: renderEmailShell(locale, 'Tasheel', `
        <h2 style="color: #1f2937; margin-top: 0;">${t.welcomeTitle.replace('{name}', escapeHtml(name))}</h2>

        <p style="color: #4b5563; font-size: 16px;">
          ${t.bodyText.replace('{accountType}', accountType)}
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${verificationUrl}" style="background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
            ${t.buttonText}
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          ${t.copyLinkText}
        </p>
        <p style="color: #3b82f6; font-size: 14px; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">
          ${verificationUrl}
        </p>

        <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
            <strong>${t.expiryNote}</strong>
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
            ${t.afterVerifyNote}
          </p>
        </div>
      `),
    })
    if (result.error) throw new Error(result.error.message)
    return { success: true }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error }
  }
}

export async function sendTempPasswordEmail(email: string, name: string, tempPassword: string, locale: Locale = 'ar') {
  const t = translations[locale].email.tempPassword

  try {
    const result = await resend.emails.send({
      from: 'Tasheel <info@tasheel.live>',
      to: email,
      subject: t.subject,
      html: renderEmailShell(locale, 'Tasheel', `
        <h2 style="color: #1f2937; margin-top: 0;">${t.title}</h2>

        <p style="color: #4b5563; font-size: 16px;">
          ${t.greeting.replace('{name}', escapeHtml(name))}
        </p>

        <div style="background: #f3f4f6; border-${getDirection(locale) === 'rtl' ? 'right' : 'left'}: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <div style="margin-bottom: 15px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: 600;">${t.emailLabel}</p>
            <p style="color: #1f2937; font-size: 16px; margin: 0; font-family: 'Courier New', monospace;">${escapeHtml(email)}</p>
          </div>
          <div>
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: 600;">${t.tempPasswordLabel}</p>
            <p style="color: #1f2937; font-size: 16px; margin: 0; font-family: 'Courier New', monospace; background: white; padding: 8px; border-radius: 4px;">${escapeHtml(tempPassword)}</p>
          </div>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.tasheel.live'}/login" style="background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
            ${t.loginButton}
          </a>
        </div>

        <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
            <strong>${t.securityNoticeTitle}</strong>
          </p>
          <ul style="color: #6b7280; font-size: 14px; margin: 8px 0; padding-${getDirection(locale) === 'rtl' ? 'right' : 'left'}: 20px;">
            <li>${t.securityNote1}</li>
            <li>${t.securityNote2}</li>
            <li>${t.securityNote3}</li>
          </ul>
        </div>
      `),
    })
    if (result.error) throw new Error(result.error.message)
    return { success: true }
  } catch (error) {
    console.error('Failed to send temp password email:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string, locale: Locale = 'ar') {
  const t = translations[locale].email.passwordReset
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.tasheel.live'}/reset-password?token=${encodeURIComponent(resetToken)}&locale=${locale}`

  try {
    const result = await resend.emails.send({
      from: 'Tasheel <info@tasheel.live>',
      to: email,
      subject: t.subject,
      html: renderEmailShell(locale, 'Tasheel', `
        <h2 style="color: #1f2937; margin-top: 0;">${t.title}</h2>

        <p style="color: #4b5563; font-size: 16px;">
          ${t.bodyText}
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
            ${t.buttonText}
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          ${t.copyLinkText}
        </p>
        <p style="color: #3b82f6; font-size: 14px; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">
          ${resetUrl}
        </p>

        <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
            <strong>${t.expiryNote}</strong>
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
            ${t.ignoreNote}
          </p>
        </div>
      `),
    })
    if (result.error) throw new Error(result.error.message)
    return { success: true }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error }
  }
}
