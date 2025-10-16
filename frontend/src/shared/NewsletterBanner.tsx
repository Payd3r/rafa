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
    <section className="bg-charcoal dark:bg-white text-white dark:text-black section-y">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-4">
        <h3 className="h3-title flex-1">{t('newsletter.title')}</h3>
        <form onSubmit={onSubmit} className="flex gap-2 w-full md:w-auto">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholder')}
            className="flex-1 md:w-80 px-3 py-2 bg-black text-white border border-white dark:bg-white dark:text-black dark:border-charcoal outline-1 outline-offset-0 focus:outline-white dark:focus:outline-charcoal rounded-none transition-colors"
          />
          {/* Bottone newsletter: sempre stile tema chiaro (opposto del tema) */}
          <button className="rounded-none border border-charcoal px-4 py-2 transition-all duration-300 ease-out bg-white text-black hover:bg-charcoal hover:text-white hover:scale-105 hover:shadow-lg active:scale-95">
            {t('newsletter.subscribe')}
          </button>
        </form>
      </div>
    </section>
  )
}


