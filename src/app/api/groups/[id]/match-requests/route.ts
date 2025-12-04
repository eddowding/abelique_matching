import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GroupProfileData } from '@/types/database'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/groups/[id]/match-requests - Get incoming requests in this group
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

  // Get incoming requests where user is the target
  const { data: requests, error } = await supabase
    .from('group_match_requests')
    .select(`
      id,
      status,
      created_at,
      requester_id,
      requester:profiles!group_match_requests_requester_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('group_id', groupId)
    .eq('target_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!requests || requests.length === 0) {
    return NextResponse.json([])
  }

  // Get memberships for all requesters to get their profile_data
  const requesterIds = requests.map(r => r.requester_id)
  const { data: memberships } = await supabase
    .from('group_memberships')
    .select('user_id, profile_data')
    .eq('group_id', groupId)
    .in('user_id', requesterIds)

  // Create a map for quick lookup
  const membershipMap = new Map<string, GroupProfileData>()
  memberships?.forEach(m => {
    membershipMap.set(m.user_id, m.profile_data as GroupProfileData)
  })

  // Transform to include requester profile data
  type RequesterData = { id: string; full_name: string; email: string }
  const transformedRequests = requests.map(r => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    requester: {
      ...(r.requester as RequesterData),
      profile_data: membershipMap.get(r.requester_id) || null,
    },
  }))

  return NextResponse.json(transformedRequests)
}

// POST /api/groups/[id]/match-requests - Send a connection request
export async function POST(request: Request, { params }: RouteParams) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { target_id } = body

  if (!target_id) {
    return NextResponse.json({ error: 'target_id is required' }, { status: 400 })
  }

  // Verify both users are members of the group
  const { data: memberships } = await supabase
    .from('group_memberships')
    .select('user_id')
    .eq('group_id', groupId)
    .in('user_id', [user.id, target_id])

  if (!memberships || memberships.length !== 2) {
    return NextResponse.json({ error: 'Both users must be members of the group' }, { status: 400 })
  }

  // Check if request already exists
  const { data: existing } = await supabase
    .from('group_match_requests')
    .select('id')
    .eq('group_id', groupId)
    .eq('requester_id', user.id)
    .eq('target_id', target_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Request already sent' }, { status: 400 })
  }

  // Create the request using service client to bypass RLS
  const { data: newRequest, error: createError } = await serviceClient
    .from('group_match_requests')
    .insert({
      group_id: groupId,
      requester_id: user.id,
      target_id: target_id,
      status: 'pending',
    })
    .select()
    .single()

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  // Check if there's a mutual request (target already requested the user)
  const { data: mutualRequest } = await serviceClient
    .from('group_match_requests')
    .select('id')
    .eq('group_id', groupId)
    .eq('requester_id', target_id)
    .eq('target_id', user.id)
    .eq('status', 'pending')
    .single()

  let is_mutual = false
  let connection = null

  if (mutualRequest) {
    // Create a connection using service client
    const { data: newConnection, error: connError } = await serviceClient
      .from('group_connections')
      .insert({
        group_id: groupId,
        user_a: user.id,
        user_b: target_id,
      })
      .select()
      .single()

    if (!connError) {
      is_mutual = true
      connection = newConnection

      // Update both requests to accepted
      await serviceClient
        .from('group_match_requests')
        .update({ status: 'accepted' })
        .in('id', [newRequest.id, mutualRequest.id])
    }
  }

  return NextResponse.json({
    request: newRequest,
    is_mutual,
    connection,
  })
}
