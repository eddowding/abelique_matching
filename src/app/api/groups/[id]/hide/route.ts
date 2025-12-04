import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/groups/[id]/hide - Hide a profile in this group
export async function POST(request: Request, { params }: RouteParams) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { hidden_id, days = 30 } = body

  if (!hidden_id) {
    return NextResponse.json({ error: 'hidden_id is required' }, { status: 400 })
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

  // Calculate hidden_until date
  const hiddenUntil = new Date()
  hiddenUntil.setDate(hiddenUntil.getDate() + days)

  // Upsert the hidden profile record using service client to bypass RLS
  const { data, error } = await serviceClient
    .from('group_hidden_profiles')
    .upsert({
      group_id: groupId,
      user_id: user.id,
      hidden_id: hidden_id,
      hidden_until: hiddenUntil.toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// DELETE /api/groups/[id]/hide - Unhide a profile in this group
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id: groupId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const hidden_id = searchParams.get('hidden_id')

  if (!hidden_id) {
    return NextResponse.json({ error: 'hidden_id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('group_hidden_profiles')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .eq('hidden_id', hidden_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
