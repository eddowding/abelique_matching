import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const GROUP_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const ED_ID = '719e34e2-6244-446b-b534-ccc956b14d99'

const PROFILES = [
  { id: ED_ID, isAdmin: true, bio: 'Building tools for human connection', current_work: 'Working on Match', looking_for: ['Collaborators', 'Friends'], offering: ['Technical skills', 'Product feedback'] },
  { id: '6c6f60ac-47b1-4349-b8a9-a9ae8eff656f', bio: 'Product manager turned founder. Building tools to help remote teams collaborate better.', current_work: 'Building a remote collaboration startup', looking_for: ['Co-founders', 'Investors', 'Mentors'], offering: ['Product feedback', 'Industry connections', 'Mentorship'] },
  { id: 'ba35a048-dea7-492d-93c0-d3172756af78', bio: 'UX researcher passionate about accessibility and inclusive design.', current_work: 'Leading UX research at a healthtech company', looking_for: ['Collaborators', 'Mentees', 'Friends'], offering: ['Design skills', 'Career advice', 'Product feedback'] },
  { id: '532523d4-b3c2-4539-a497-2e69e4f0c570', bio: 'Full-stack engineer with 8 years experience. Love building developer tools.', current_work: 'Senior Engineer at a Series B startup', looking_for: ['Co-founders', 'Mentees', 'Job opportunities'], offering: ['Technical skills', 'Mentorship', 'Career advice'] },
  { id: '1385b85e-5af5-41d0-93c7-92ed178787dc', bio: 'Marketing strategist helping startups find product-market fit.', current_work: 'Fractional CMO for early-stage startups', looking_for: ['Collaborators', 'Friends', 'Learning partners'], offering: ['Marketing help', 'Business expertise', 'Industry connections'] },
  { id: '5e2fa5bb-aba8-4c01-a5ee-36a493db5103', bio: 'Data scientist exploring ML applications in creative industries.', current_work: 'Building AI tools for musicians', looking_for: ['Collaborators', 'Co-founders', 'Investors'], offering: ['Technical skills', 'Product feedback', 'Friendship'] },
  { id: 'f887cc62-2e13-49d1-a3c0-c4a9ab329b9b', bio: 'Angel investor and former CTO. Happy to chat about fundraising or tech architecture.', current_work: 'Angel investing and advising startups', looking_for: ['Mentees', 'Friends'], offering: ['Funding', 'Mentorship', 'Business expertise'] },
  { id: '588d4a9a-e3c6-472d-8430-00582db9ddd1', bio: 'Designer exploring the intersection of AI and creativity.', current_work: 'Freelance design and AI experiments', looking_for: ['Collaborators', 'Learning partners', 'Friends'], offering: ['Design skills', 'Product feedback', 'Friendship'] },
  { id: '8f4cd940-15fb-485e-b4d2-7eefc36c1dcd', bio: 'Climate tech founder working on carbon capture solutions.', current_work: 'CEO of a climate tech startup', looking_for: ['Investors', 'Advisors', 'Hiring talent'], offering: ['Industry connections', 'Mentorship', 'Business expertise'] },
  { id: 'fd3b8573-ff38-4490-b105-7f3b7ac63fe2', bio: 'Community builder and event organizer. Love connecting people.', current_work: 'Running tech community events', looking_for: ['Collaborators', 'Friends', 'Learning partners'], offering: ['Industry connections', 'Friendship', 'Career advice'] },
  { id: 'e10ac1aa-8365-4802-a902-9a8feb149504', bio: 'Product designer with a background in psychology. Fascinated by behavior change.', current_work: 'Principal Designer at a fintech company', looking_for: ['Mentees', 'Collaborators', 'Friends'], offering: ['Design skills', 'Mentorship', 'Career advice'] },
]

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

async function main() {
  console.log('Seeding demo group with embeddings...\n')

  for (const profile of PROFILES) {
    const profileText = `${profile.bio}\n\nCurrently: ${profile.current_work}\n\nLooking for: ${profile.looking_for.join(', ')}\n\nOffering: ${profile.offering.join(', ')}`

    console.log(`Processing: ${profile.id.substring(0, 8)}...`)

    try {
      // Check if already in group
      const { data: existing } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', GROUP_ID)
        .eq('user_id', profile.id)
        .single()

      if (existing) {
        console.log('  Already in group, skipping')
        continue
      }

      const embedding = await generateEmbedding(profileText)

      const { error } = await supabase
        .from('group_memberships')
        .insert({
          group_id: GROUP_ID,
          user_id: profile.id,
          profile_data: {
            bio: profile.bio,
            current_work: profile.current_work,
            looking_for: profile.looking_for,
            offering: profile.offering,
          },
          embedding,
          role: profile.isAdmin ? 'admin' : 'member',
        })

      if (error) {
        console.log(`  Error: ${error.message}`)
      } else {
        console.log(`  Added ${profile.isAdmin ? '(admin)' : ''}`)
      }
    } catch (err) {
      console.log(`  Error: ${err}`)
    }
  }

  console.log('\nDone! Visit: /groups/a1b2c3d4-e5f6-7890-abcd-ef1234567890')
}

main()
