import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

export async function sendVerificationEmail(email: string, name: string, verificationToken: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.tasheel.live'}/verify-email?token=${verificationToken}`

  try {
    await resend.emails.send({
      from: 'Tasheel <info@tasheel.live>',
      to: email,
      subject: 'Verify Your Email - Tasheel',
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
              <h2 style="color: #1f2937; margin-top: 0;">Welcome to Tasheel, ${name}!</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                Your contractor account has been created. Please verify your email address to complete your registration and receive your login credentials.
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${verificationUrl}" style="background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #3b82f6; font-size: 14px; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">
                ${verificationUrl}
              </p>
              
              <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
                  <strong>Important:</strong> This verification link will expire in 24 hours.
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
                  After verification, you'll receive your login credentials via email.
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
    console.error('Failed to send verification email:', error)
    return { success: false, error }
  }
}

export async function sendTempPasswordEmail(email: string, name: string, tempPassword: string) {
  try {
    await resend.emails.send({
      from: 'Tasheel <info@tasheel.live>',
      to: email,
      subject: 'Your Tasheel Login Credentials',
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
              <h2 style="color: #1f2937; margin-top: 0;">Your Account is Ready!</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                Hi ${name}, your email has been verified successfully. Here are your login credentials:
              </p>
              
              <div style="background: #f3f4f6; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <div style="margin-bottom: 15px;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: 600;">Email</p>
                  <p style="color: #1f2937; font-size: 16px; margin: 0; font-family: 'Courier New', monospace;">${email}</p>
                </div>
                <div>
                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: 600;">Temporary Password</p>
                  <p style="color: #1f2937; font-size: 16px; margin: 0; font-family: 'Courier New', monospace; background: white; padding: 8px; border-radius: 4px;">${tempPassword}</p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.tasheel.live'}/login" style="background: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Login to Tasheel
                </a>
              </div>
              
              <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
                  <strong>Important Security Notice:</strong>
                </p>
                <ul style="color: #6b7280; font-size: 14px; margin: 8px 0; padding-left: 20px;">
                  <li>You will be required to change this password on your first login</li>
                  <li>Choose a strong password with at least 8 characters</li>
                  <li>Never share your password with anyone</li>
                </ul>
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
    console.error('Failed to send temp password email:', error)
    return { success: false, error }
  }
}

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
