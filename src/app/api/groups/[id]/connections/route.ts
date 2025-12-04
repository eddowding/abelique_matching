import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GroupProfileData } from '@/types/database'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/groups/[id]/connections - Get connections in this group
export async function GET(request: Request, { params }: RouteParams) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('group_memberships')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  // Get connections where user is either user_a or user_b
  const { data: connections, error } = await supabase
    .from('group_connections')
    .select(`
      id,
      match_reason,
      created_at,
      user_a_profile:profiles!group_connections_user_a_fkey (
        id,
        full_name,
        email,
        linkedin_url
      ),
      user_b_profile:profiles!group_connections_user_b_fkey (
        id,
        full_name,
        email,
        linkedin_url
      )
    `)
    .eq('group_id', groupId)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Transform to show the "other person" and include their group profile
  type ProfileData = { id: string; full_name: string; email: string; linkedin_url: string | null }
  const transformedConnections = await Promise.all(
    (connections || []).map(async (c) => {
      const userAProfile = c.user_a_profile as ProfileData
      const userBProfile = c.user_b_profile as ProfileData
      const otherProfile = userAProfile.id === user.id ? userBProfile : userAProfile

      // Get the other person's group membership for profile_data
      const { data: otherMembership } = await supabase
        .from('group_memberships')
        .select('profile_data')
        .eq('group_id', groupId)
        .eq('user_id', otherProfile.id)
        .single()

      return {
        id: c.id,
        match_reason: c.match_reason,
        created_at: c.created_at,
        other_user: {
          ...otherProfile,
          profile_data: otherMembership?.profile_data as GroupProfileData,
        },
      }
    })
  )

  return NextResponse.json(transformedConnections)
}

// POST /api/groups/[id]/connections - Accept a match request (create connection)
export async function POST(request: Request, { params }: RouteParams) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { request_id } = body

  if (!request_id) {
    return NextResponse.json({ error: 'request_id is required' }, { status: 400 })
  }

  // Get the request and verify user is the target
  const { data: matchRequest, error: requestError } = await supabase
    .from('group_match_requests')
    .select('*')
    .eq('id', request_id)
    .eq('group_id', groupId)
    .eq('target_id', user.id)
    .eq('status', 'pending')
    .single()

  if (requestError || !matchRequest) {
    return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 })
  }

  // Create the connection using service client to bypass RLS
  const { data: connection, error: connError } = await serviceClient
    .from('group_connections')
    .insert({
      group_id: groupId,
      user_a: matchRequest.requester_id,
      user_b: user.id,
    })
    .select()
    .single()

  if (connError) {
    return NextResponse.json({ error: connError.message }, { status: 400 })
  }

  // Update the request status using service client
  await serviceClient
    .from('group_match_requests')
    .update({ status: 'accepted' })
    .eq('id', request_id)

  // Get the other user's profile info
  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('id, full_name, email, linkedin_url')
    .eq('id', matchRequest.requester_id)
    .single()

  const { data: otherMembership } = await supabase
    .from('group_memberships')
    .select('profile_data')
    .eq('group_id', groupId)
    .eq('user_id', matchRequest.requester_id)
    .single()

  return NextResponse.json({
    connection,
    other_user: {
      ...otherProfile,
      profile_data: otherMembership?.profile_data as GroupProfileData,
    },
  })
}
