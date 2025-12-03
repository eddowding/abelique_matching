import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all connections where user is either user_a or user_b
  const { data: connections, error } = await supabase
    .from('connections')
    .select(`
      *,
      profile_a:profiles!connections_user_a_fkey(*),
      profile_b:profiles!connections_user_b_fkey(*)
    `)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to show the "other" person
  const connectionsWithOther = connections?.map(conn => {
    const otherProfile = conn.user_a === user.id ? conn.profile_b : conn.profile_a
    return {
      id: conn.id,
      created_at: conn.created_at,
      match_reason: conn.match_reason,
      profile: otherProfile,
    }
  })

  return NextResponse.json(connectionsWithOther)
}
