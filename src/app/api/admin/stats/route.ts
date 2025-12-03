import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

export async function GET() {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use service role for admin queries
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get users created in last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: newUsersThisWeek } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    // Get total connections
    const { count: totalConnections } = await supabaseAdmin
      .from('connections')
      .select('*', { count: 'exact', head: true })

    // Get pending requests
    const { count: pendingRequests } = await supabaseAdmin
      .from('match_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get users with embeddings
    const { count: usersWithEmbeddings } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null)

    // Get recent users
    const { data: recentUsers } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, created_at, embedding')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get all users for the table
    const { data: allUsers } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, bio, current_work, looking_for, offering, linkedin_url, created_at, embedding')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        totalConnections: totalConnections || 0,
        pendingRequests: pendingRequests || 0,
        usersWithEmbeddings: usersWithEmbeddings || 0,
      },
      recentUsers: recentUsers?.map(u => ({
        ...u,
        hasEmbedding: !!u.embedding,
      })) || [],
      allUsers: allUsers?.map(u => ({
        ...u,
        hasEmbedding: !!u.embedding,
      })) || [],
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
