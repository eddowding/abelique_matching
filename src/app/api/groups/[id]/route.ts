import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/groups/[id] - Get group details
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from('group_memberships')
    .select('role')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  // Get group details and stats in parallel
  const [groupResult, memberCountResult, connectionCountResult, profilesWithEmbeddingResult] = await Promise.all([
    supabase.from('groups').select('*').eq('id', id).single(),
    serviceClient.from('group_memberships').select('*', { count: 'exact', head: true }).eq('group_id', id),
    serviceClient.from('group_connections').select('*', { count: 'exact', head: true }).eq('group_id', id),
    serviceClient.from('group_memberships').select('*', { count: 'exact', head: true }).eq('group_id', id).not('embedding', 'is', null),
  ])

  if (groupResult.error) {
    return NextResponse.json({ error: groupResult.error.message }, { status: 404 })
  }

  const group = groupResult.data

  return NextResponse.json({
    ...group,
    role: membership.role,
    member_count: memberCountResult.count || 0,
    connection_count: connectionCountResult.count || 0,
    profiles_complete: profilesWithEmbeddingResult.count || 0,
    // Show invite_code to all members so anyone can share
    invite_code: group.invite_code,
  })
}

// PUT /api/groups/[id] - Update group (admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: membership } = await supabase
    .from('group_memberships')
    .select('role')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, password, regenerate_invite } = body

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (name !== undefined) {
    updates.name = name.trim()
  }
  if (description !== undefined) {
    updates.description = description?.trim() || null
  }
  if (password !== undefined) {
    updates.password = password ? await bcrypt.hash(password, 10) : null
  }
  if (regenerate_invite) {
    // Generate new invite code
    updates.invite_code = [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
  }

  const { data: group, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(group)
}

// DELETE /api/groups/[id] - Delete group (admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: membership } = await supabase
    .from('group_memberships')
    .select('role')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Delete group (cascades to memberships, connections, etc.)
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
