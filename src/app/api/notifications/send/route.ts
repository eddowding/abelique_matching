import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendEmail, newRequestEmail, mutualMatchEmail } from '@/lib/email/resend'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  // Verify this is called with a secret (for cron/webhook security)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get unsent notifications
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select(`
        *,
        user:profiles!notifications_user_id_fkey(id, email, full_name)
      `)
      .is('sent_at', null)
      .limit(50)

    if (fetchError) {
      throw fetchError
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ message: 'No notifications to send', sent: 0 })
    }

    const results = await Promise.all(
      notifications.map(async (notification) => {
        try {
          const user = notification.user as { id: string; email: string; full_name: string }
          if (!user?.email) {
            return { id: notification.id, success: false, error: 'No email' }
          }

          // Check user preferences
          const { data: prefs } = await supabaseAdmin
            .from('notification_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single()

          let emailContent: { subject: string; html: string } | null = null

          if (notification.type === 'new_request') {
            // Skip if user disabled this notification type
            if (prefs && !prefs.email_new_requests) {
              await supabaseAdmin
                .from('notifications')
                .update({ sent_at: new Date().toISOString() })
                .eq('id', notification.id)
              return { id: notification.id, success: true, skipped: 'user_preference' }
            }

            // Get requester info
            const { data: requester } = await supabaseAdmin
              .from('profiles')
              .select('full_name')
              .eq('id', notification.data.requester_id)
              .single()

            if (requester) {
              emailContent = newRequestEmail(requester.full_name)
            }
          } else if (notification.type === 'mutual_match') {
            // Skip if user disabled this notification type
            if (prefs && !prefs.email_mutual_matches) {
              await supabaseAdmin
                .from('notifications')
                .update({ sent_at: new Date().toISOString() })
                .eq('id', notification.id)
              return { id: notification.id, success: true, skipped: 'user_preference' }
            }

            // Get other user info
            const { data: otherUser } = await supabaseAdmin
              .from('profiles')
              .select('full_name, email, linkedin_url')
              .eq('id', notification.data.other_user_id)
              .single()

            if (otherUser) {
              emailContent = mutualMatchEmail(
                otherUser.full_name,
                otherUser.email,
                otherUser.linkedin_url
              )
            }
          }

          if (!emailContent) {
            return { id: notification.id, success: false, error: 'Unknown notification type' }
          }

          // Send the email
          const result = await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
          })

          if (result.success) {
            // Mark as sent
            await supabaseAdmin
              .from('notifications')
              .update({ sent_at: new Date().toISOString() })
              .eq('id', notification.id)
          }

          return { id: notification.id, ...result }
        } catch (error) {
          console.error(`Error processing notification ${notification.id}:`, error)
          return { id: notification.id, success: false, error: String(error) }
        }
      })
    )

    const sent = results.filter(r => r.success && !('skipped' in r)).length
    const skipped = results.filter(r => 'skipped' in r).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      message: 'Notifications processed',
      sent,
      skipped,
      failed,
      results,
    })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
