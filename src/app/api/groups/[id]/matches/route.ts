import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GroupProfileData } from '@/types/database'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type RouteParams = { params: Promise<{ id: string }> }

async function generateMatchReason(
  userProfile: { full_name: string; profile_data: GroupProfileData },
  matchProfile: { full_name: string; profile_data: GroupProfileData }
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate a brief 1 sentence reason why YOU (the reader) should connect with this person. Write in second person (use "you" and "they"). Focus on what they offer that matches what you need, or shared interests. Be specific and warm. Example: "They could help with your fundraising - they have investor connections and you\'re looking for funding."',
        },
        {
          role: 'user',
          content: `You: ${userProfile.profile_data?.bio || ''} Working on: ${userProfile.profile_data?.current_work || ''} Looking for: ${userProfile.profile_data?.looking_for?.join(', ') || ''} Offering: ${userProfile.profile_data?.offering?.join(', ') || ''}

Them: ${matchProfile.profile_data?.bio || ''} Working on: ${matchProfile.profile_data?.current_work || ''} Looking for: ${matchProfile.profile_data?.looking_for?.join(', ') || ''} Offering: ${matchProfile.profile_data?.offering?.join(', ') || ''}`,
        },
      ],
      max_tokens: 60,
      temperature: 0.7,
    })
    return response.choices[0].message.content || ''
  } catch {
    return ''
  }
}

// GET /api/groups/[id]/matches - Get matches within this group
export async function GET(request: Request, { params }: RouteParams) {
  const { id: groupId } = await params
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's membership and embedding
  const { data: membership, error: memberError } = await supabase
    .from('group_memberships')
    .select('id, embedding, profile_data')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (memberError || !membership) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  if (!membership.embedding) {
    return NextResponse.json({ error: 'Please complete your profile first' }, { status: 400 })
  }

  // Get excluded profiles (hidden, already requested, already connected)
  const [hiddenResult, requestedResult, connectedResult] = await Promise.all([
    supabase
      .from('group_hidden_profiles')
      .select('hidden_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id),
    supabase
      .from('group_match_requests')
      .select('target_id')
      .eq('group_id', groupId)
      .eq('requester_id', user.id),
    supabase
      .from('group_connections')
      .select('user_a, user_b')
      .eq('group_id', groupId)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
  ])

  const excludeIds = new Set<string>([user.id])

  hiddenResult.data?.forEach(h => excludeIds.add(h.hidden_id))
  requestedResult.data?.forEach(r => excludeIds.add(r.target_id))
  connectedResult.data?.forEach(c => {
    excludeIds.add(c.user_a)
    excludeIds.add(c.user_b)
  })

  // Call the RPC function for vector similarity search
  const { data: matches, error: matchError } = await supabase
    .rpc('match_group_profiles', {
      p_group_id: groupId,
      p_query_embedding: membership.embedding,
      p_match_count: 500, // Get more to filter
      p_current_user_id: user.id,
    })

  if (matchError) {
    console.error('Match error:', matchError)
    return NextResponse.json({ error: matchError.message }, { status: 400 })
  }

  // Filter out excluded profiles and paginate
  const filteredMatches = (matches || [])
    .filter(m => !excludeIds.has(m.user_id))
    .slice(offset, offset + limit)

  // Get user's profile for the response
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const currentUserProfile = {
    full_name: userProfile?.full_name || '',
    profile_data: membership.profile_data as GroupProfileData,
  }

  // Generate match reasons for top matches (only first page, max 5)
  const matchesWithReasons = await Promise.all(
    filteredMatches.map(async (m, index) => {
      let match_reason = ''
      // Only generate reasons for first 5 matches on first page
      if (offset === 0 && index < 5) {
        match_reason = await generateMatchReason(currentUserProfile, {
          full_name: m.full_name,
          profile_data: m.profile_data as GroupProfileData,
        })
      }
      return {
        user_id: m.user_id,
        full_name: m.full_name,
        email: m.email,
        linkedin_url: m.linkedin_url,
        profile_data: m.profile_data as GroupProfileData,
        similarity: m.similarity,
        match_reason,
      }
    })
  )

  return NextResponse.json({
    matches: matchesWithReasons,
    current_user: {
      looking_for: (membership.profile_data as GroupProfileData)?.looking_for || [],
      offering: (membership.profile_data as GroupProfileData)?.offering || [],
    },
    offset,
    limit,
    has_more: (matches || []).filter(m => !excludeIds.has(m.user_id)).length > offset + limit,
  })
}
