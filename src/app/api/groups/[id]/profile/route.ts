import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateEmbedding, profileToEmbeddingText } from '@/lib/openai'
import { NextResponse } from 'next/server'
import { GroupProfileData, Json } from '@/types/database'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/groups/[id]/profile - Get user's profile for this group
export async function GET(request: Request, { params }: RouteParams) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get membership with profile data
  const { data: membership, error } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (error || !membership) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  // Get user's basic profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, linkedin_url')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    membership_id: membership.id,
    group_id: membership.group_id,
    role: membership.role,
    profile_data: membership.profile_data as GroupProfileData,
    has_embedding: !!membership.embedding,
    joined_at: membership.joined_at,
    updated_at: membership.updated_at,
    // Include basic profile info
    full_name: profile?.full_name,
    email: profile?.email,
    linkedin_url: profile?.linkedin_url,
  })
}

// PUT /api/groups/[id]/profile - Update user's profile for this group
export async function PUT(request: Request, { params }: RouteParams) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from('group_memberships')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  const body = await request.json()
  const { bio, current_work, looking_for, offering, linkedin_url } = body

  // Build profile data object
  const profileData: GroupProfileData = {
    bio: bio?.trim() || undefined,
    current_work: current_work?.trim() || undefined,
    looking_for: Array.isArray(looking_for) ? looking_for : undefined,
    offering: Array.isArray(offering) ? offering : undefined,
    linkedin_url: linkedin_url?.trim() || undefined,
  }

  // Generate embedding from profile data
  const embeddingText = profileToEmbeddingText({
    bio: profileData.bio,
    current_work: profileData.current_work,
    looking_for: profileData.looking_for,
    offering: profileData.offering,
  })

  let embedding: number[] | null = null
  if (embeddingText.trim()) {
    try {
      embedding = await generateEmbedding(embeddingText)
    } catch (e) {
      console.error('Failed to generate embedding:', e)
    }
  }

  // Update membership with profile data and embedding using service client
  const { data: updated, error } = await serviceClient
    .from('group_memberships')
    .update({
      profile_data: profileData as unknown as Json,
      embedding: embedding ? `[${embedding.join(',')}]` : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', membership.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Also update the user's main profile linkedin_url if provided
  if (linkedin_url !== undefined) {
    await serviceClient
      .from('profiles')
      .update({ linkedin_url: linkedin_url?.trim() || null })
      .eq('id', user.id)
  }

  return NextResponse.json({
    membership_id: updated.id,
    group_id: updated.group_id,
    role: updated.role,
    profile_data: updated.profile_data as GroupProfileData,
    has_embedding: !!updated.embedding,
    updated_at: updated.updated_at,
  })
}
