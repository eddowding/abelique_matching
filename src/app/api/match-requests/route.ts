import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET incoming match requests
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get pending requests where current user is the target
  const { data: requests, error } = await supabase
    .from('match_requests')
    .select(`
      *,
      requester:profiles!match_requests_requester_id_fkey(*)
    `)
    .eq('target_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(requests)
}

// POST create a new match request (connect with someone)
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { target_id } = await request.json()

  if (!target_id) {
    return NextResponse.json({ error: 'target_id is required' }, { status: 400 })
  }

  if (target_id === user.id) {
    return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 })
  }

  // Create the match request - the trigger will handle mutual match detection
  const { data: matchRequest, error } = await supabase
    .from('match_requests')
    .insert({
      requester_id: user.id,
      target_id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already requested' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check if it resulted in a connection (mutual match)
  const { data: connection } = await supabase
    .from('connections')
    .select('*')
    .or(`and(user_a.eq.${user.id},user_b.eq.${target_id}),and(user_a.eq.${target_id},user_b.eq.${user.id})`)
    .single()

  return NextResponse.json({
    request: matchRequest,
    is_mutual: !!connection,
    connection,
  })
}
