import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const FROM = `"ArthaSift" <${process.env.GMAIL_USER}>`
const BASE = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export async function sendVerificationEmail(to: string, name: string, otp: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${otp} is your ArthaSift verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d1117;color:#e2e8f0;border-radius:12px">
        <h2 style="color:#10b981;margin:0 0 4px">ArthaSift</h2>
        <p style="margin:0 0 28px;color:#64748b;font-size:13px">Your intelligent investment research desk</p>
        <h3 style="margin:0 0 8px;color:#f1f5f9;font-size:18px">Hello ${name},</h3>
        <p style="color:#94a3b8;line-height:1.6;margin:0 0 24px">
          Use the code below to verify your email address and activate your ArthaSift account.
        </p>
        <div style="margin:0 0 24px;padding:24px 0;background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.2);border-radius:10px;text-align:center">
          <p style="margin:0 0 6px;font-size:11px;color:#64748b;letter-spacing:0.1em;text-transform:uppercase">Your verification code</p>
          <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#10b981;font-family:monospace">${otp}</span>
        </div>
        <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px">
          This code expires in <strong style="color:#e2e8f0">15 minutes</strong>.
          Enter it on the verification page to complete your signup.
        </p>
        <p style="color:#475569;font-size:12px;margin:0">
          If you didn't create a ArthaSift account, you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0"/>
        <p style="color:#334155;font-size:11px;margin:0">
          ArthaSift · India's AI Platform for Investors &amp; Entrepreneurs
        </p>
      </div>
    `,
  })
}

export async function send2FAOtpEmail(to: string, name: string, otp: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${otp} — Your ArthaSift login code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d1117;color:#e2e8f0;border-radius:12px">
        <h2 style="color:#10b981;margin:0 0 8px">ArthaSift</h2>
        <p style="margin:0 0 24px;color:#64748b;font-size:14px">Two-step verification</p>
        <h3 style="margin:0 0 12px;color:#f1f5f9">Hello ${name},</h3>
        <p style="color:#94a3b8;line-height:1.6">Your login verification code is:</p>
        <div style="margin:24px 0;padding:20px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:10px;text-align:center">
          <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#10b981">${otp}</span>
        </div>
        <p style="color:#64748b;font-size:13px">This code expires in <strong style="color:#f1f5f9">10 minutes</strong>.</p>
        <p style="color:#64748b;font-size:12px;margin-top:16px">If you didn't attempt to sign in, your account is secure — someone else may have your password. Consider changing it.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${BASE}/reset-password?token=${token}`
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Reset your ArthaSift password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d1117;color:#e2e8f0;border-radius:12px">
        <h2 style="color:#10b981;margin:0 0 8px">ArthaSift</h2>
        <h3 style="margin:0 0 12px;color:#f1f5f9">Password reset request</h3>
        <p style="color:#94a3b8;line-height:1.6">Hello ${name}, click below to reset your password. This link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
          Reset Password →
        </a>
        <p style="color:#64748b;font-size:12px">If you didn't request a password reset, ignore this email.</p>
      </div>
    `,
  })
}
