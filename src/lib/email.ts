import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.tasheel.live'}/reset-password?token=${resetToken}`

  try {
    await resend.emails.send({
      from: 'Tasheel <info@tasheel.live>',
      to: email,
      subject: 'Reset Your Password - Tasheel',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Tasheel</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                We received a request to reset your password for your Tasheel account. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #3b82f6; font-size: 14px; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">
                ${resetUrl}
              </p>
              
              <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
                  <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Tasheel. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error }
  }
}
