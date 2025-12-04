import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Find your people
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered matchmaking for communities. Create a group for your
            team, cohort, or community and let AI help everyone find the right connections.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/groups/new">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Create a Group
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Free to use. Anyone can create a group.
          </p>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Groups for Any Community</h3>
            <p className="text-gray-600 text-sm">
              Create a group for your accelerator cohort, company offsite, conference, or any community.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">AI-Powered Matching</h3>
            <p className="text-gray-600 text-sm">
              AI understands who is looking for what, and suggests the best connections with explanations.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Mutual Matching</h3>
            <p className="text-gray-600 text-sm">
              Contact info only shared when both people want to connect. No awkward cold outreach.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Create a group', desc: 'Anyone can create a group and invite members via link' },
              { step: '2', title: 'Set up profiles', desc: 'Members describe what they\'re looking for and offering' },
              { step: '3', title: 'Browse matches', desc: 'AI ranks members by compatibility with explanations' },
              { step: '4', title: 'Connect', desc: 'When it\'s mutual, exchange contact info' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Use cases */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl font-bold mb-6">Perfect for</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Accelerator cohorts',
              'Company offsites',
              'Conferences',
              'Alumni networks',
              'Community groups',
              'Networking events',
            ].map(useCase => (
              <span
                key={useCase}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {useCase}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
