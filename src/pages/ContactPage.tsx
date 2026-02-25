import emailjs from '@emailjs/browser'
import { LoaderCircle, Mail, Send } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'

import type { ContactConfig } from '@/types/content'

interface ContactPageProps {
  config: ContactConfig
}

interface ContactFormValues {
  name: string
  email: string
  subject: string
  message: string
}

const initialFormValues: ContactFormValues = {
  name: '',
  email: '',
  subject: '',
  message: '',
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function ContactPage({ config }: ContactPageProps) {
  const [values, setValues] = useState<ContactFormValues>(initialFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

  const emailReady = useMemo(() => {
    return Boolean(serviceID && templateID && publicKey)
  }, [publicKey, serviceID, templateID])

  const handleChange = (field: keyof ContactFormValues, value: string): void => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const name = values.name.trim()
    const email = values.email.trim()
    const subject = values.subject.trim()
    const message = values.message.trim()

    if (!name || !email || !subject || !message) {
      setErrorMessage('Please complete all fields before sending.')
      return
    }

    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (!emailReady || !serviceID || !templateID || !publicKey) {
      setErrorMessage('Email service is not configured yet. Add EmailJS keys to your .env file.')
      return
    }

    setIsSubmitting(true)

    try {
      await emailjs.send(
        serviceID,
        templateID,
        {
          name,
          email,
          subject,
          message,
          user_name: name,
          user_email: email,
          from_name: name,
          from_email: email,
          reply_to: email,
          submitted_at: new Date().toISOString(),
        },
        {
          publicKey,
        },
      )

      setSuccessMessage('Message sent successfully. We will get back to you soon, in sha Allah.')
      setValues(initialFormValues)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send message right now. Please try again shortly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-grid contact-page">
      <section className="panel reveal contact-hero">
        <p className="kicker">
          <Mail size={16} />
          Contact
        </p>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
        <p className="source-note">Status: {config.statusText}</p>
      </section>

      <section className="panel reveal contact-form-card">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form-grid">
            <label className="select-wrap" htmlFor="contact-name">
              Name
              <input
                id="contact-name"
                type="text"
                value={values.name}
                onChange={(event) => handleChange('name', event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                disabled={isSubmitting}
                required
              />
            </label>

            <label className="select-wrap" htmlFor="contact-email">
              Email
              <input
                id="contact-email"
                type="email"
                value={values.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                required
              />
            </label>
          </div>

          <label className="select-wrap" htmlFor="contact-subject">
            Subject
            <input
              id="contact-subject"
              type="text"
              value={values.subject}
              onChange={(event) => handleChange('subject', event.target.value)}
              placeholder="How can we help?"
              disabled={isSubmitting}
              required
            />
          </label>

          <label className="select-wrap" htmlFor="contact-message">
            Message
            <textarea
              id="contact-message"
              value={values.message}
              onChange={(event) => handleChange('message', event.target.value)}
              placeholder="Write your message here..."
              rows={7}
              disabled={isSubmitting}
              required
            />
          </label>

          <div className="contact-submit-row">
            <button type="submit" className="btn btn-solid" disabled={isSubmitting || !emailReady}>
              {isSubmitting ? <LoaderCircle size={14} className="spin" /> : <Send size={14} />}
              {isSubmitting ? 'Sending…' : 'Send message'}
            </button>
            <small className="source-note">Powered by EmailJS</small>
          </div>

          {!emailReady ? <p className="state-text error">Add `VITE_EMAILJS_*` keys to enable sending.</p> : null}
          {errorMessage ? <p className="state-text error">{errorMessage}</p> : null}
          {successMessage ? <p className="state-text success">{successMessage}</p> : null}
        </form>
      </section>
    </main>
  )
}
