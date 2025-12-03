import OpenAI from 'openai'
import { Profile } from '@/types/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

export function profileToEmbeddingText(profile: Partial<Profile>): string {
  const parts: string[] = []

  if (profile.bio) {
    parts.push(profile.bio)
  }

  if (profile.current_work) {
    parts.push(`Currently working on: ${profile.current_work}`)
  }

  if (profile.looking_for?.length) {
    parts.push(`Looking for: ${profile.looking_for.join(', ')}`)
  }

  if (profile.offering?.length) {
    parts.push(`Can offer: ${profile.offering.join(', ')}`)
  }

  return parts.join('\n')
}

export async function generateMatchReason(
  profileA: Profile,
  profileB: Profile
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful matchmaker. Generate a brief, specific 1-2 sentence explanation of why two people might want to connect professionally or socially. Focus on shared interests, complementary skills, or mutual benefits. Be warm but concise.',
      },
      {
        role: 'user',
        content: `Person A:
Name: ${profileA.full_name}
Bio: ${profileA.bio || 'Not provided'}
Working on: ${profileA.current_work || 'Not provided'}
Looking for: ${profileA.looking_for?.join(', ') || 'Not specified'}
Can offer: ${profileA.offering?.join(', ') || 'Not specified'}

Person B:
Name: ${profileB.full_name}
Bio: ${profileB.bio || 'Not provided'}
Working on: ${profileB.current_work || 'Not provided'}
Looking for: ${profileB.looking_for?.join(', ') || 'Not specified'}
Can offer: ${profileB.offering?.join(', ') || 'Not specified'}

Why might ${profileA.full_name.split(' ')[0]} want to connect with ${profileB.full_name.split(' ')[0]}?`,
      },
    ],
    max_tokens: 100,
    temperature: 0.7,
  })

  return response.choices[0].message.content || 'You might have interesting things to discuss!'
}
