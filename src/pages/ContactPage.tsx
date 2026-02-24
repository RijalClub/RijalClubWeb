import { Construction, Mail } from 'lucide-react'

import type { ContactConfig } from '@/types/content'

interface ContactPageProps {
  config: ContactConfig
}

export function ContactPage({ config }: ContactPageProps) {
  return (
    <main className="page-grid contact-page">
      <section className="panel reveal contact-hero">
        <p className="kicker">
          <Mail size={16} />
          Contact
        </p>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </section>

      <section className="panel reveal contact-placeholder">
        <Construction size={26} />
        <h2>{config.statusText}</h2>
        <p>Contact form and official channels will be added here.</p>
      </section>
    </main>
  )
}
