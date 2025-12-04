import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

// DELETE /api/groups/[id]/membership - Leave a group
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get membership and check role
  const { data: membership } = await supabase
    .from('group_memberships')
    .select('id, role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 404 })
  }

  // Check if user is the only admin
  if (membership.role === 'admin') {
    const { count: adminCount } = await serviceClient
      .from('group_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('role', 'admin')

    if (adminCount === 1) {
      // Check if there are other members
      const { count: memberCount } = await serviceClient
        .from('group_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)

      if (memberCount && memberCount > 1) {
        return NextResponse.json(
          { error: 'You are the only admin. Please promote another member to admin before leaving, or delete the group.' },
          { status: 400 }
        )
      }
      // If only member, they can leave (effectively deleting the group)
    }
  }

  // Delete related data first using service client
  await Promise.all([
    // Delete match requests where user is requester or target
    serviceClient
      .from('group_match_requests')
      .delete()
      .eq('group_id', groupId)
      .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`),
    // Delete connections where user is involved
    serviceClient
      .from('group_connections')
      .delete()
      .eq('group_id', groupId)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
    // Delete hidden profiles by or of user
    serviceClient
      .from('group_hidden_profiles')
      .delete()
      .eq('group_id', groupId)
      .or(`user_id.eq.${user.id},hidden_id.eq.${user.id}`),
  ])

  // Delete the membership
  const { error: deleteError } = await serviceClient
    .from('group_memberships')
    .delete()
    .eq('id', membership.id)

  if (deleteError) {
    console.error('Error deleting membership:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  // Check if group is now empty and delete it
  const { count: remainingMembers } = await serviceClient
    .from('group_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  if (remainingMembers === 0) {
    // Delete the empty group
    await serviceClient.from('groups').delete().eq('id', groupId)
  }

  return NextResponse.json({ success: true })
}
