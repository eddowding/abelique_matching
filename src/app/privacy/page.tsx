import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy - Abelique',
  description: 'How the Abelique pilot handles your data',
}

const collected = [
  ['Contact details', 'WhatsApp number, email address, which channel you prefer', 'You, when you join'],
  ['Name', 'The name you give us', 'You'],
  ['Community and who invited you', '"Joined the alumni group, invited by Sam"', 'Your join link or invite'],
  ['Your messages', 'What you send Abelique, including voice notes', 'You'],
  ['Your profile', "What you're working on, need, offer, know about, and when you're free, in your own words", 'Drafted from your messages; only saved once you confirm it'],
  ['Rough location', 'Your town or county, and the centre of your postcode district (such as SO20), never your full address', 'You, if you choose to share it'],
  ['Introductions', 'Who you were matched with, whether each of you said yes, who you met', 'Your answers to match cards'],
  ['Your choices', 'Which permissions you gave and when, check-in frequency, whether you have paused', 'You'],
  ['Message records', 'Date, direction and type of each message', 'Created as you chat'],
]

const uses = [
  ['Running your chat with Abelique and building your profile', "Contract: it's the service you joined for"],
  ['Suggesting matches within your communities and showing anonymous match cards', 'Contract'],
  ['Introducing you to someone, only after you both say yes', 'Your consent, given each time'],
  ['Checking in with you (monthly by default)', 'Your consent, given when you join; send PAUSE any time'],
  ['Showing your profile beyond your own communities, or to AI agents you connect', 'Your consent, off unless you turn it on'],
  ['Letting members forward a card about your need or offer to a friend outside Abelique (still without your name)', 'Your consent, given when you join'],
  ['Keeping the service safe (spam, abuse, rate limits)', 'Legitimate interests'],
]

const providers = [
  ['Meta (WhatsApp)', 'Your number and the messages you exchange with Abelique', 'Carrying the chat', 'Global, including the US'],
  ['Anthropic (Claude AI)', 'Your own messages and profile, and confirmed profile items from your communities when matching', 'Drafting replies and judging which matches are worth suggesting', 'US'],
  ['Cloudflare', 'Messages in transit between WhatsApp or email and our computer, encrypted', 'Secure connection and email forwarding', 'Global'],
  ['postcodes.io', 'Your postcode district only (such as SO20), never your name or number', 'Finding a rough map point for in-person matches', 'UK'],
]

const retention = [
  ['The text of your messages and voice notes', '30 days, then deleted. We keep only the date and type of each message.'],
  ['Your profile items', "Until you withdraw them, they're met, or they expire"],
  ['Your contact details, choices and introduction history', 'Until you leave, or until the pilot ends and its data is deleted'],
]

const commands = [
  ['PAUSE or STOP', 'No more check-ins or match cards until you say otherwise'],
  ['RESUME', 'Picks up again'],
  ['EXPORT', 'Sends you everything we hold about you'],
  ['DELETE ME', 'Deletes your profile, messages, permissions, community memberships, introduction history and contact details'],
  ['HELP', 'Lists these options'],
]

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {head.map(h => (
              <th key={h} className="text-left font-semibold text-gray-900 border-b border-gray-300 py-2 pr-4 align-bottom">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r[0]}>
              {r.map((cell, i) => (
                <td key={i} className="border-b border-gray-200 py-2 pr-4 align-top text-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold text-gray-900 mt-10 mb-3">{children}</h2>
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16 text-gray-700 leading-relaxed">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">Abelique</Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-4">Privacy</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated 6 November 2026</p>

        <p className="mt-6">
          This policy covers the Abelique pilot on WhatsApp and email. Abelique introduces people to each other
          one-to-one, and only when both say yes.
        </p>

        <H2>Who we are</H2>
        <p>
          Abelique is a small, invite-only pilot run by its founders. Before the pilot opens beyond its first
          testers, this page will name the company responsible for your data (the data controller) and its
          registration with the Information Commissioner&apos;s Office.
        </p>
        <p className="mt-3">
          Questions or requests: email <a href="mailto:hello@abelique.com" className="underline">hello@abelique.com</a>,
          or message Abelique on WhatsApp. A person reads every privacy request.
        </p>

        <H2>What we collect</H2>
        <p>
          We only hold what you tell Abelique in your private one-to-one chat, plus the details needed to run it.
          We never join or read group chats.
        </p>
        <Table head={['What', 'Examples', 'Where it comes from']} rows={collected} />
        <p>
          We don&apos;t collect special category data (health, religion, politics and so on) on purpose. If you
          mention it in a message, the message is deleted after 30 days, and it only goes into your profile if you
          confirm it there.
        </p>

        <H2>Why we use it</H2>
        <p>
          We use your data to find people worth introducing you to, and for nothing else. We never sell it or use it
          for advertising.
        </p>
        <Table head={['Use', 'Legal basis']} rows={uses} />
        <p>
          A match card never shows your name or contact details. They&apos;re only shared once both people have said
          yes. Nobody is told when someone says no.
        </p>

        <H2>Who else handles it</H2>
        <p>
          Your data is stored in one database on a server in the EU (Contabo), run by the founders. A few providers handle parts of it
          for us, only to deliver the service:
        </p>
        <Table head={['Provider', 'What they handle', 'Why', 'Where']} rows={providers} />
        <p>
          The AI model only sees what&apos;s needed for the task in front of it and has no access to anything else.
          When data goes to the US, it is protected by the safeguards UK data protection law requires.
        </p>

        <H2>How long we keep it</H2>
        <Table head={['Data', 'Kept for']} rows={retention} />
        <p>When the pilot ends, we&apos;ll tell you what happens next, and we&apos;ll delete everything unless you choose to carry on.</p>

        <H2>Your choices and rights</H2>
        <p>You can do most of this yourself by sending one word to Abelique:</p>
        <Table head={['Send', 'What happens']} rows={commands} />
        <p>
          Under UK data protection law you also have the right to correct your data, to object to how we use it, and
          to withdraw any consent at any time. Email <a href="mailto:hello@abelique.com" className="underline">hello@abelique.com</a> and
          we&apos;ll reply within one month.
        </p>
        <p className="mt-3">
          If you&apos;re unhappy with how we&apos;ve handled your data, tell us first. You can also complain to the
          Information Commissioner&apos;s Office at{' '}
          <a href="https://ico.org.uk/make-a-complaint/" className="underline">ico.org.uk/make-a-complaint</a> or on
          0303 123 1113.
        </p>
      </div>
    </div>
  )
}
