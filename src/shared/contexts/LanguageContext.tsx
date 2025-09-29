import { createContext, useContext, useState, type ReactNode } from 'react'

export type Language = 'it' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('it')

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Traduzioni
const translations = {
  it: {
    // Navigation
    nav: {
      home: 'Home',
      gallery: 'Galleria',
      projects: 'Progetti'
    },
    // Home page
    home: {
      photographer: 'FOTOGRAFO',
      heroTitle: 'INSIDE.FARAOSTUDIO',
      heroDescription: 'Fotografia in bianco e nero con carattere deciso e composizione pulita. Ogni scatto racconta una storia attraverso contrasti netti e geometrie essenziali.',
      readMore: 'Read more',
      myLatestWorks: 'I Miei Ultimi Lavori',
      bestProjects: 'Migliori Progetti',
      seeAllProjects: 'Vedi tutti i progetti',
      seeAllPhotos: 'Vedi tutte le foto'
    },
    // Projects page
    projects: {
      title: 'I Miei Progetti',
      description: 'Una raccolta dei miei lavori fotografici più significativi, esplorando temi diversi attraverso l\'obiettivo della fotografia in bianco e nero.'
    },
    // Gallery page
    gallery: {
      title: 'Galleria'
    },
    // Project detail page
    projectDetail: {
      notFound: 'Progetto non trovato',
      notFoundDescription: 'Il progetto che stai cercando non esiste o è stato rimosso.',
      backToProjects: 'Torna ai progetti',
      backToProjectsLink: '← Torna ai progetti',
      photos: 'fotografie',
      photo: 'foto',
      viewProject: 'Visualizza progetto →'
    },
    // Footer
    footer: {
      copyright: 'Tutti i diritti riservati',
      instagram: 'Instagram',
      backstage: 'Backstage',
      unsplash: 'Unsplash',
      issuu: 'Issuu'
    },
    // Newsletter
    newsletter: {
      title: 'Iscriviti alla newsletter',
      placeholder: 'La tua email',
      subscribe: 'Subscribe'
    },
    // Project descriptions
    projectDescriptions: {
      progetto1: 'Volti e storie nelle strade della città, in contrasto netto b/n. Una serie che cattura l\'essenza umana attraverso sguardi intensi e momenti di vita quotidiana.',
      progetto2: 'Architetture e geometrie con forte uso di ombre e luce radente. Un\'esplorazione delle forme architettoniche attraverso il gioco di luci e ombre.',
      progetto3: 'Spazi interni che raccontano storie attraverso la luce naturale. Un viaggio negli ambienti domestici e commerciali.',
      progetto4: 'La dialettica tra movimento e immobilità nella fotografia di strada. Catturare l\'attimo fuggente e l\'eternità del momento.',
      progetto5: 'Le texture delle superfici urbane raccontano la storia della città. Mura, pavimenti, metalli che portano i segni del tempo.',
      progetto6: 'La potenza espressiva delle silhouette contro la luce. Figure che si stagliano nette sullo sfondo.',
      progetto7: 'La bellezza del minimalismo nella fotografia urbana. Spazi vuoti, linee pulite, composizioni essenziali.'
    },
    // Common
    common: {
      loading: 'Caricamento...',
      error: 'Errore',
      close: 'Chiudi',
      next: 'Avanti',
      prev: 'Indietro'
    }
  },
  en: {
    // Navigation
    nav: {
      home: 'Home',
      gallery: 'Gallery',
      projects: 'Projects'
    },
    // Home page
    home: {
      photographer: 'PHOTOGRAPHER',
      heroTitle: 'INSIDE.FARAOSTUDIO',
      heroDescription: 'Black and white photography with bold character and clean composition. Every shot tells a story through sharp contrasts and essential geometries.',
      readMore: 'Read more',
      myLatestWorks: 'My Latest Works',
      bestProjects: 'Best Projects',
      seeAllProjects: 'See all projects',
      seeAllPhotos: 'See all photos'
    },
    // Projects page
    projects: {
      title: 'My Projects',
      description: 'A collection of my most significant photographic works, exploring different themes through the lens of black and white photography.'
    },
    // Gallery page
    gallery: {
      title: 'Gallery'
    },
    // Project detail page
    projectDetail: {
      notFound: 'Project not found',
      notFoundDescription: 'The project you are looking for does not exist or has been removed.',
      backToProjects: 'Back to projects',
      backToProjectsLink: '← Back to projects',
      photos: 'photographs',
      photo: 'photo',
      viewProject: 'View project →'
    },
    // Footer
    footer: {
      copyright: 'All rights reserved',
      instagram: 'Instagram',
      backstage: 'Backstage',
      unsplash: 'Unsplash',
      issuu: 'Issuu'
    },
    // Newsletter
    newsletter: {
      title: 'Subscribe to newsletter',
      placeholder: 'Your email',
      subscribe: 'Subscribe'
    },
    // Project descriptions
    projectDescriptions: {
      progetto1: 'Faces and stories in the city streets, in stark b/w contrast. A series that captures human essence through intense gazes and moments of daily life.',
      progetto2: 'Architectures and geometries with strong use of shadows and grazing light. An exploration of architectural forms through the play of light and shadow.',
      progetto3: 'Interior spaces that tell stories through natural light. A journey through domestic and commercial environments.',
      progetto4: 'The dialectic between movement and stillness in street photography. Capturing the fleeting moment and the eternity of the instant.',
      progetto5: 'Urban surface textures tell the story of the city. Walls, floors, metals that bear the marks of time.',
      progetto6: 'The expressive power of silhouettes against light. Figures that stand out sharply against the background.',
      progetto7: 'The beauty of minimalism in urban photography. Empty spaces, clean lines, essential compositions.'
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      close: 'Close',
      next: 'Next',
      prev: 'Previous'
    }
  }
}
