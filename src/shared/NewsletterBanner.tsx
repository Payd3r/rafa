import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from './hooks/useTranslation'

export function NewsletterBanner() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    // mock submit
    alert(`${t('newsletter.subscribe')}: ${email}`)
    setEmail('')
  }
  return (
    <section className="bg-charcoal text-white section-y">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-4">
        <h3 className="h3-title flex-1">{t('newsletter.title')}</h3>
        <form onSubmit={onSubmit} className="flex gap-2 w-full md:w-auto">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholder')}
            className="flex-1 md:w-80 px-3 py-2 text-black border border-charcoal rounded-none"
          />
          <button className="btn bg-sand text-black border-sand hover:bg-black hover:text-white">{t('newsletter.subscribe')}</button>
        </form>
      </div>
    </section>
  )
}


