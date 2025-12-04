import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// GET /api/groups - List user's groups
export async function GET() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all groups the user is a member of
  const { data: memberships, error } = await supabase
    .from('group_memberships')
    .select(`
      role,
      joined_at,
      groups (
        id,
        name,
        slug,
        description,
        invite_code,
        creator_id,
        created_at
      )
    `)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Get member counts for each group
  type GroupData = { id: string; name: string; slug: string; description: string | null; invite_code: string; creator_id: string; created_at: string }
  const groupIds = memberships?.map(m => (m.groups as GroupData)?.id).filter(Boolean) || []

  const memberCounts: Record<string, number> = {}
  if (groupIds.length > 0) {
    const { data: counts } = await supabase
      .from('group_memberships')
      .select('group_id')
      .in('group_id', groupIds)

    if (counts) {
      counts.forEach(c => {
        memberCounts[c.group_id] = (memberCounts[c.group_id] || 0) + 1
      })
    }
  }

  // Transform to include role and member count
  const groups = memberships?.map(m => ({
    ...m.groups,
    role: m.role,
    joined_at: m.joined_at,
    member_count: memberCounts[(m.groups as GroupData)?.id] || 0,
  })) || []

  return NextResponse.json(groups)
}

// POST /api/groups - Create a new group
export async function POST(request: Request) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, password } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Math.random().toString(36).substring(2, 6)

  // Hash password if provided
  let hashedPassword: string | null = null
  if (password && typeof password === 'string' && password.length > 0) {
    hashedPassword = await bcrypt.hash(password, 10)
  }

  // Create the group using service client to bypass RLS
  const { data: group, error: groupError } = await serviceClient
    .from('groups')
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      password: hashedPassword,
      creator_id: user.id,
    })
    .select()
    .single()

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 400 })
  }

  // Add creator as admin member using service client
  const { error: memberError } = await serviceClient
    .from('group_memberships')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin',
      profile_data: {},
    })

  if (memberError) {
    // Rollback group creation if membership fails
    await serviceClient.from('groups').delete().eq('id', group.id)
    return NextResponse.json({ error: memberError.message }, { status: 400 })
  }

  return NextResponse.json({
    ...group,
    role: 'admin',
    member_count: 1,
  })
}
