import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/openai'

const TEST_PROFILES = [
  {
    full_name: 'Priya Patel',
    email: 'priya@example.com',
    bio: 'Product manager turned founder. Building tools to help remote teams collaborate better.',
    current_work: 'Building a remote collaboration startup',
    looking_for: ['Co-founders', 'Investors', 'Mentors'],
    offering: ['Product feedback', 'Industry connections', 'Mentorship'],
    linkedin_url: 'https://linkedin.com/in/priyapatel',
  },
  {
    full_name: 'Marcus Chen',
    email: 'marcus@example.com',
    bio: 'Full-stack engineer with 10 years experience. Love building developer tools and mentoring junior devs.',
    current_work: 'Senior Engineer at a Series B startup',
    looking_for: ['Collaborators', 'Mentees', 'Job opportunities'],
    offering: ['Technical skills', 'Career advice', 'Mentorship'],
    linkedin_url: 'https://linkedin.com/in/marcuschen',
  },
  {
    full_name: 'Sarah Johnson',
    email: 'sarah@example.com',
    bio: 'Designer and artist exploring the intersection of AI and creativity. Always looking for interesting projects.',
    current_work: 'Freelance design and AI art experiments',
    looking_for: ['Collaborators', 'Learning partners', 'Friends'],
    offering: ['Design skills', 'Product feedback', 'Friendship'],
    linkedin_url: 'https://linkedin.com/in/sarahjohnson',
  },
  {
    full_name: 'David Kim',
    email: 'david@example.com',
    bio: 'Angel investor and former CTO. Happy to chat about fundraising, tech architecture, or startup life.',
    current_work: 'Angel investing and advising startups',
    looking_for: ['Mentees', 'Job opportunities', 'Friends'],
    offering: ['Funding', 'Business expertise', 'Industry connections'],
    linkedin_url: 'https://linkedin.com/in/davidkim',
  },
  {
    full_name: 'Elena Rodriguez',
    email: 'elena@example.com',
    bio: 'Marketing lead at a growth-stage company. Passionate about brand building and content strategy.',
    current_work: 'Leading marketing at a fintech startup',
    looking_for: ['Collaborators', 'Mentors', 'Friends'],
    offering: ['Marketing help', 'Career advice', 'Industry connections'],
    linkedin_url: 'https://linkedin.com/in/elenarodriguez',
  },
  {
    full_name: 'James Wright',
    email: 'james@example.com',
    bio: 'Serial entrepreneur on my third startup. Previously exited a B2B SaaS company. Love helping first-time founders.',
    current_work: 'CEO of an AI-powered analytics platform',
    looking_for: ['Advisors', 'Hiring talent', 'Investors'],
    offering: ['Mentorship', 'Business expertise', 'Industry connections'],
    linkedin_url: 'https://linkedin.com/in/jameswright',
  },
  {
    full_name: 'Aisha Mohammed',
    email: 'aisha@example.com',
    bio: 'Data scientist passionate about using ML for social good. Looking to connect with mission-driven people.',
    current_work: 'Building ML models for climate tech',
    looking_for: ['Collaborators', 'Co-founders', 'Learning partners'],
    offering: ['Technical skills', 'Career advice', 'Product feedback'],
    linkedin_url: 'https://linkedin.com/in/aishamohammed',
  },
  {
    full_name: 'Tom Anderson',
    email: 'tom@example.com',
    bio: 'Former VP of Engineering, now consulting and advising early-stage startups on scaling their tech teams.',
    current_work: 'Fractional CTO and technical advisor',
    looking_for: ['Mentees', 'Job opportunities', 'Friends'],
    offering: ['Technical skills', 'Mentorship', 'Career advice'],
    linkedin_url: 'https://linkedin.com/in/tomanderson',
  },
]

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Get admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  let groupId = body.group_id

  // If no group_id provided, create a new test group
  if (!groupId) {
    const inviteCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16)

    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: 'Demo Group',
        slug: `demo-group-${Date.now()}`,
        description: 'A demo group with test users for exploring the matching features.',
        invite_code: inviteCode,
        creator_id: user.id,
      })
      .select()
      .single()

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 500 })
    }

    groupId = newGroup.id

    // Add current user as admin
    const userProfileText = 'Tech enthusiast exploring new connections'
    const userEmbedding = await generateEmbedding(userProfileText)

    await supabase
      .from('group_memberships')
      .insert({
        group_id: groupId,
        user_id: user.id,
        profile_data: {
          bio: 'Testing the matching app!',
          current_work: 'Exploring connections',
          looking_for: ['Collaborators', 'Friends'],
          offering: ['Friendship'],
        },
        embedding: `[${userEmbedding.join(',')}]`,
        role: 'admin',
      })
  } else {
    // Check user is admin of this group
    const { data: membership } = await supabase
      .from('group_memberships')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Must be group admin' }, { status: 403 })
    }
  }

  const results = []

  for (const profile of TEST_PROFILES) {
    try {
      // Create or get profile
      let { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', profile.email)
        .single()

      let profileId: string

      if (existingProfile) {
        profileId = existingProfile.id
      } else {
        // Create a fake UUID for test user
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            full_name: profile.full_name,
            email: profile.email,
            linkedin_url: profile.linkedin_url,
          })
          .select('id')
          .single()

        if (profileError) {
          results.push({ name: profile.full_name, error: profileError.message })
          continue
        }
        profileId = newProfile.id
      }

      // Check if already in group
      const { data: existingMembership } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', profileId)
        .single()

      if (existingMembership) {
        results.push({ name: profile.full_name, status: 'already in group' })
        continue
      }

      // Generate embedding for this profile
      const profileText = `${profile.bio}\n\nCurrently: ${profile.current_work}\n\nLooking for: ${profile.looking_for.join(', ')}\n\nOffering: ${profile.offering.join(', ')}`
      const embedding = await generateEmbedding(profileText)

      // Add to group
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
          group_id: groupId,
          user_id: profileId,
          profile_data: {
            bio: profile.bio,
            current_work: profile.current_work,
            looking_for: profile.looking_for,
            offering: profile.offering,
            linkedin_url: profile.linkedin_url,
          },
          embedding: `[${embedding.join(',')}]`,
          role: 'member',
        })

      if (membershipError) {
        results.push({ name: profile.full_name, error: membershipError.message })
      } else {
        results.push({ name: profile.full_name, status: 'added' })
      }
    } catch (err) {
      results.push({ name: profile.full_name, error: String(err) })
    }
  }

  // Get the group details to return
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  return NextResponse.json({
    group,
    results,
    url: `/groups/${groupId}`
  })
}
