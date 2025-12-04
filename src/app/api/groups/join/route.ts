import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// POST /api/groups/join - Join a group via password or invite code
export async function POST(request: Request) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { slug, password, invite_code } = body

  // Must provide either (slug + password) OR invite_code
  if (!invite_code && !slug) {
    return NextResponse.json({ error: 'Provide either invite_code or slug' }, { status: 400 })
  }

  let group: {
    id: string
    name: string
    slug: string
    password: string | null
    invite_code: string
  } | null = null

  // Find group by invite code OR by slug
  if (invite_code) {
    const { data } = await supabase
      .from('groups')
      .select('id, name, slug, password, invite_code')
      .eq('invite_code', invite_code)
      .single()
    group = data
  } else if (slug) {
    const { data } = await supabase
      .from('groups')
      .select('id, name, slug, password, invite_code')
      .eq('slug', slug)
      .single()
    group = data
  }

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  // Check if already a member
  const { data: existingMembership } = await supabase
    .from('group_memberships')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single()

  if (existingMembership) {
    return NextResponse.json({
      group_id: group.id,
      group_name: group.name,
      already_member: true,
    })
  }

  // If joining via slug (not invite code), verify password
  if (!invite_code && slug) {
    if (group.password) {
      if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 400 })
      }
      const isValid = await bcrypt.compare(password, group.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 403 })
      }
    }
    // If no password set, anyone can join via slug
  }

  // Ensure user has a profile (required for foreign key)
  // Use service client to bypass RLS for profile creation
  const { data: existingProfile } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    // Create a minimal profile for the new user
    const { error: profileError } = await serviceClient
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }
  }

  // Create membership using service client to bypass RLS
  // We've already verified the user is authenticated above
  console.log('Creating membership:', { group_id: group.id, user_id: user.id })

  const { data: membership, error: memberError } = await serviceClient
    .from('group_memberships')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'member',
      profile_data: {},
    })
    .select()
    .single()

  if (memberError) {
    console.error('Membership insert error:', memberError, { group_id: group.id, user_id: user.id })
    return NextResponse.json({ error: memberError.message }, { status: 400 })
  }

  return NextResponse.json({
    group_id: group.id,
    group_name: group.name,
    group_slug: group.slug,
    role: 'member',
    membership_id: membership.id,
  })
}
