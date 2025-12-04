import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/account - Get current user's account info
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get group memberships count
  const { count: groupCount } = await supabase
    .from('group_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get connections count
  const { count: connectionCount } = await supabase
    .from('group_connections')
    .select('*', { count: 'exact', head: true })
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile,
    stats: {
      groups: groupCount || 0,
      connections: connectionCount || 0,
    },
  })
}

// DELETE /api/account - Delete current user's account and all data
export async function DELETE() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

  // Delete in order to respect foreign key constraints
  // 1. Delete group hidden profiles (where user hid someone or was hidden)
  await supabase
    .from('group_hidden_profiles')
    .delete()
    .or(`user_id.eq.${userId},hidden_id.eq.${userId}`)

  // 2. Delete group connections (where user is either party)
  await supabase
    .from('group_connections')
    .delete()
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)

  // 3. Delete group match requests (sent or received)
  await supabase
    .from('group_match_requests')
    .delete()
    .or(`requester_id.eq.${userId},target_id.eq.${userId}`)

  // 4. Delete group memberships
  await supabase
    .from('group_memberships')
    .delete()
    .eq('user_id', userId)

  // 5. Delete old hidden profiles
  await supabase
    .from('hidden_profiles')
    .delete()
    .or(`user_id.eq.${userId},hidden_id.eq.${userId}`)

  // 6. Delete old connections
  await supabase
    .from('connections')
    .delete()
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)

  // 7. Delete old match requests
  await supabase
    .from('match_requests')
    .delete()
    .or(`requester_id.eq.${userId},target_id.eq.${userId}`)

  // 8. Delete notifications
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)

  // 9. Delete notification preferences
  await supabase
    .from('notification_preferences')
    .delete()
    .eq('user_id', userId)

  // 10. Delete profile
  await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  // 11. Sign out the user (this will invalidate the session)
  await supabase.auth.signOut()

  return NextResponse.json({ success: true, message: 'Account deleted' })
}
