import { useTranslation } from './hooks/useTranslation'

export function Footer() {
  const { t } = useTranslation()
  
  return (
    <footer className="border-t border-charcoal mt-16">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="leading-snug">© {new Date().getFullYear()} INSIDE.FARAOSTUDIO — {t('footer.copyright')}</span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="https://www.instagram.com/inside.faraostudio/" target="_blank" rel="noopener noreferrer" className="hover:text-charcoal transition-colors">{t('footer.instagram')}</a>
          <a href="https://www.instagram.com/scattacci/" target="_blank" rel="noopener noreferrer" className="hover:text-charcoal transition-colors">{t('footer.backstage')}</a>
          <a href="https://unsplash.com/it/@inside_faraostudio" target="_blank" rel="noopener noreferrer" className="hover:text-charcoal transition-colors">{t('footer.unsplash')}</a>
          <a href="https://issuu.com/inside.faraostudio" target="_blank" rel="noopener noreferrer" className="hover:text-charcoal transition-colors">{t('footer.issuu')}</a>
        </div>
      </div>
    </footer>
  )
}


