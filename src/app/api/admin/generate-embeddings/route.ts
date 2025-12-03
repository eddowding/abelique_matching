import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { generateEmbedding, profileToEmbeddingText } from '@/lib/openai'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  // Verify with cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all profiles without embeddings
    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, bio, current_work, looking_for, offering')
      .is('embedding', null)

    if (fetchError) {
      throw fetchError
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No profiles need embeddings', updated: 0 })
    }

    const results = await Promise.all(
      profiles.map(async (profile) => {
        try {
          const text = profileToEmbeddingText(profile)
          if (!text.trim()) {
            return { id: profile.id, success: false, error: 'No text to embed' }
          }

          const embedding = await generateEmbedding(text)

          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ embedding: `[${embedding.join(',')}]` })
            .eq('id', profile.id)

          if (updateError) {
            return { id: profile.id, success: false, error: updateError.message }
          }

          return { id: profile.id, success: true }
        } catch (error) {
          return { id: profile.id, success: false, error: String(error) }
        }
      })
    )

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      message: 'Embeddings generated',
      updated: successful,
      failed,
      results,
    })
  } catch (error) {
    console.error('Error generating embeddings:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
