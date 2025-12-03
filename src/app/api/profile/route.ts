import { createClient } from '@/lib/supabase/server'
import { generateEmbedding, profileToEmbeddingText } from '@/lib/openai'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(profile)
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { full_name, bio, current_work, looking_for, offering, linkedin_url } = body

  // Generate embedding from profile text
  const embeddingText = profileToEmbeddingText({
    bio,
    current_work,
    looking_for,
    offering,
  })

  let embedding: number[] | null = null
  if (embeddingText.trim()) {
    try {
      embedding = await generateEmbedding(embeddingText)
    } catch (e) {
      console.error('Failed to generate embedding:', e)
    }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email!,
      full_name,
      bio,
      current_work,
      looking_for,
      offering,
      linkedin_url,
      embedding: embedding ? `[${embedding.join(',')}]` : null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(profile)
}

export async function POST(request: Request) {
  // POST is for creating new profiles (same as PUT with upsert)
  return PUT(request)
}
