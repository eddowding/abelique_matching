import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || 'Match <notifications@yourdomain.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface EmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set, skipping email:', { to, subject })
    return { success: true, skipped: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

export function newRequestEmail(requesterName: string) {
  return {
    subject: `${requesterName} wants to connect with you on Match`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">Someone wants to connect!</h1>
          <p style="font-size: 16px; margin-bottom: 24px;">
            <strong>${requesterName}</strong> has expressed interest in connecting with you.
          </p>
          <p style="margin-bottom: 24px;">
            Check out their profile and decide if you'd like to connect back. If you both connect, you'll be able to see each other's contact information.
          </p>
          <a href="${APP_URL}/requests" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View Request
          </a>
          <p style="margin-top: 32px; font-size: 14px; color: #666;">
            You're receiving this because you have an account on Match.
            <a href="${APP_URL}/profile" style="color: #666;">Manage notification preferences</a>
          </p>
        </body>
      </html>
    `,
  }
}

export function mutualMatchEmail(matchName: string, matchEmail: string, matchLinkedIn?: string | null) {
  const contactInfo = matchLinkedIn
    ? `<p><strong>LinkedIn:</strong> <a href="${matchLinkedIn}">${matchLinkedIn}</a></p>`
    : ''

  return {
    subject: `It's a match! You and ${matchName} connected`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">It's a match! 🎉</h1>
          <p style="font-size: 16px; margin-bottom: 24px;">
            Great news! You and <strong>${matchName}</strong> both wanted to connect.
          </p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px;">Contact Information</h3>
            <p style="margin: 0;"><strong>Email:</strong> <a href="mailto:${matchEmail}">${matchEmail}</a></p>
            ${contactInfo}
          </div>
          <p style="margin-bottom: 24px;">
            Reach out and start a conversation! A simple "Hi, I saw we matched on Match..." works great.
          </p>
          <a href="${APP_URL}/connections" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View All Connections
          </a>
          <p style="margin-top: 32px; font-size: 14px; color: #666;">
            You're receiving this because you have an account on Match.
            <a href="${APP_URL}/profile" style="color: #666;">Manage notification preferences</a>
          </p>
        </body>
      </html>
    `,
  }
}

export function weeklyDigestEmail(stats: { newMatches: number; pendingRequests: number }) {
  return {
    subject: `Your weekly Match update: ${stats.newMatches} new matches`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #111; font-size: 24px; margin-bottom: 16px;">Your Weekly Update</h1>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 18px;"><strong>${stats.newMatches}</strong> potential new matches</p>
            <p style="margin: 0; font-size: 18px;"><strong>${stats.pendingRequests}</strong> pending connection requests</p>
          </div>
          <a href="${APP_URL}/discover" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Check Your Matches
          </a>
          <p style="margin-top: 32px; font-size: 14px; color: #666;">
            You're receiving this because you have an account on Match.
            <a href="${APP_URL}/profile" style="color: #666;">Unsubscribe from weekly digest</a>
          </p>
        </body>
      </html>
    `,
  }
}
