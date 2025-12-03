import { createClient } from '@/lib/supabase/server'
import { generateMatchReason } from '@/lib/openai'
import { NextResponse } from 'next/server'
import { Profile } from '@/types/database'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const includeReasons = searchParams.get('reasons') === 'true'

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current user's profile with embedding
  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !currentProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // For now, show ALL profiles (including self for testing)
  // TODO: Re-enable filtering once there are more users
  const showAll = searchParams.get('all') === 'true'

  if (showAll || !currentProfile.embedding) {
    // Show all profiles for demo/testing with pagination
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    const matchesWithScores = (allProfiles || []).map(profile => ({
      ...profile,
      similarity: profile.id === user.id ? 1.0 : 0.5,
      match_reason: profile.id === user.id ? 'This is you!' : null as string | null,
    }))

    return NextResponse.json(matchesWithScores)
  }

  // Get IDs to exclude (hidden profiles and already requested)
  const { data: hiddenProfiles } = await supabase
    .from('hidden_profiles')
    .select('hidden_id')
    .eq('user_id', user.id)

  const { data: requestedProfiles } = await supabase
    .from('match_requests')
    .select('target_id')
    .eq('requester_id', user.id)

  const { data: connectedProfiles } = await supabase
    .from('connections')
    .select('user_a, user_b')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

  const excludeIds = new Set<string>([user.id])
  hiddenProfiles?.forEach(h => excludeIds.add(h.hidden_id))
  requestedProfiles?.forEach(r => r.target_id && excludeIds.add(r.target_id))
  connectedProfiles?.forEach(c => {
    if (c.user_a && c.user_a !== user.id) excludeIds.add(c.user_a)
    if (c.user_b && c.user_b !== user.id) excludeIds.add(c.user_b)
  })

  // Query for similar profiles using pgvector
  const { data: matches, error: matchError } = await supabase.rpc('match_profiles', {
    query_embedding: currentProfile.embedding,
    match_count: limit + excludeIds.size,
    current_user_id: user.id,
  })

  if (matchError) {
    // Fallback: get all profiles
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .limit(100)

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    const filteredProfiles = allProfiles?.filter(p => !excludeIds.has(p.id)) || []

    const matchesWithScores = filteredProfiles.slice(0, limit).map(profile => ({
      ...profile,
      similarity: 0.5,
      match_reason: null as string | null,
    }))

    return NextResponse.json(matchesWithScores)
  }

  // Filter and limit results
  const filteredMatches = matches
    ?.filter((m: { id: string }) => !excludeIds.has(m.id))
    .slice(0, limit) || []

  // Optionally generate match reasons
  if (includeReasons && filteredMatches.length > 0) {
    const matchesWithReasons = await Promise.all(
      filteredMatches.map(async (match) => {
        try {
          const reason = await generateMatchReason(currentProfile as Profile, match as unknown as Profile)
          return { ...match, match_reason: reason }
        } catch {
          return { ...match, match_reason: null }
        }
      })
    )
    return NextResponse.json(matchesWithReasons)
  }

  return NextResponse.json(filteredMatches)
}
