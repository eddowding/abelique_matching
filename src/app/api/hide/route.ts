import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST hide a profile (not now)
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { hidden_id, days = 30 } = await request.json()

  if (!hidden_id) {
    return NextResponse.json({ error: 'hidden_id is required' }, { status: 400 })
  }

  // Calculate hidden_until (30 days from now by default)
  const hiddenUntil = new Date()
  hiddenUntil.setDate(hiddenUntil.getDate() + days)

  const { data, error } = await supabase
    .from('hidden_profiles')
    .upsert({
      user_id: user.id,
      hidden_id,
      hidden_until: hiddenUntil.toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE unhide a profile
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { hidden_id } = await request.json()

  if (!hidden_id) {
    return NextResponse.json({ error: 'hidden_id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('hidden_profiles')
    .delete()
    .eq('user_id', user.id)
    .eq('hidden_id', hidden_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
