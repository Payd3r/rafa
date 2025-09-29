import { Header } from '../shared/Header'
import { Footer } from '../shared/Footer'
import { ProjectCard } from '../shared/ProjectCard'
import { projects } from '../shared/data/projects'
import { Link } from 'react-router-dom'
import { useTranslation } from '../shared/hooks/useTranslation'

export default function Projects() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <main className="section-y max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="h1-hero mb-4">{t('projects.title')}</h1>
          <p className="text-lg text-gray700 max-w-2xl mx-auto">
            {t('projects.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {projects.map((project) => (
            <Link 
              key={project.slug} 
              to={`/projects/${project.slug}`} 
              className="group block transition-transform hover:scale-105"
            >
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>
        
      </main>
      <Footer />
    </div>
  )
}


