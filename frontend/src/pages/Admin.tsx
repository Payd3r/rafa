import { ProjectMediaEditor } from './ProjectMediaEditor'
import { PROJECT_CATEGORIES, categoryLabel, type ProjectCategory } from '../shared/categories'
import { SmartImage } from '../portfolio/SmartImage'
import type { Photo } from '../shared/types'
import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react'
import { resizeImageForPreview, resizeImagesForPreview } from '../shared/utils/imageResize'
interface ImagePreview { file: File; preview: string }
interface Project { slug: string; title: string; hasCover?: boolean; galleryIndices?: number[]; coverImageIndex?: string; dateISO: string; category: ProjectCategory; type: 'photo' | 'video'; hasVideo?: boolean; imageCount: number; instagramUrl?: string }
const api = (path: string) => `${import.meta.env.VITE_BACKEND_URL || ''}/api/admin${path}`
async function request(path: string, options?: RequestInit) {
  const response = await fetch(api(path), options)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Operazione non riuscita')
  return data
}
function CategoryToggle({ value, onChange, disabled }: { value: string; onChange: (value: ProjectCategory) => void; disabled?: boolean }) {
  return <div role="group" aria-label="Categoria" className="flex flex-wrap gap-2">{PROJECT_CATEGORIES.map(category => <button type="button" key={category.value} aria-pressed={value === category.value} disabled={disabled} onClick={() => onChange(category.value)} className={`px-4 py-2 border border-charcoal ${value === category.value ? 'bg-black text-white' : 'bg-white text-black'}`}>{category.label}</button>)}</div>
}
function Icon({ name }: { name: 'edit' | 'delete' }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{name === 'edit' ? <path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5"/> : <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>}</svg>
}
export default function Admin() {
  const [tab, setTab] = useState('photo')
  return <main className="min-h-screen bg-white text-black py-8"><div className="max-w-6xl mx-auto px-4"><h1 className="text-3xl font-bold mb-6">Admin</h1><nav aria-label="Gestione contenuti" className="flex flex-wrap gap-2 border-b border-charcoal mb-8">{[['photo','Carica progetto foto'],['video','Carica progetto video'],['best','Migliori foto'],['projects','Gestione progetti']].map(([value,label]) => <button key={value} onClick={() => setTab(value)} aria-current={tab === value ? 'page' : undefined} className={`px-4 py-3 border-b-2 ${tab === value ? 'border-black font-bold' : 'border-transparent'}`}>{label}</button>)}</nav>{(tab === 'photo' || tab === 'video') && <UploadTab key={tab} type={tab}/ >}{tab === 'best' && <BestPhotosTab/>}{tab === 'projects' && <ProjectsTab/>}</div></main>
}
function UploadTab({ type }: { type: 'photo' | 'video' }) {
  const [category, setCategory] = useState<ProjectCategory | ''>('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [coverImage, setCoverImage] = useState<ImagePreview | null>(null)
  const [images, setImages] = useState<ImagePreview[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isProcessingImages, setIsProcessingImages] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const handleCoverChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const isValid = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png'

    if (!isValid) {
      alert(`File ${file.name} non è un formato valido (usa JPG o PNG)`)
      return
    }

    setIsProcessingImages(true)
    try {
      const previewUrl = await resizeImageForPreview(file, 600, 0.85)
      setCoverImage({ file, preview: previewUrl })
    } catch (error) {
      console.error('Errore ridimensionamento:', error)
      alert('Errore nel processare l\'immagine')
    } finally {
      setIsProcessingImages(false)
    }
  }

  const removeCover = () => {
    setCoverImage(null)
  }

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      const isValid = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png'
      if (!isValid) {
        alert(`File ${file.name} non è un formato valido (usa JPG o PNG)`)
      }
      return isValid
    })

    if (images.length + validFiles.length > 30) {
      alert('Massimo 30 immagini per la galleria')
      return
    }

    setIsProcessingImages(true)
    try {
      const previewUrls = await resizeImagesForPreview(validFiles)
      const newPreviews: ImagePreview[] = validFiles.map((file, index) => ({
        file,
        preview: previewUrls[index]
      }))
      setImages(prev => [...prev, ...newPreviews])
    } catch (error) {
      console.error('Errore ridimensionamento batch:', error)
      alert('Errore nel processare alcune immagini')
    } finally {
      setIsProcessingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      newImages.splice(index, 1)
      return newImages
    })
  }

  const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const isValid = file.type === 'video/mp4' || file.type === 'video/webm' || file.type === 'video/quicktime'

    if (!isValid) {
      alert(`File ${file.name} non è un formato valido (usa MP4, WebM o MOV)`)
      return
    }

    const maxSize = 1024 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`Il video ${file.name} supera il limite di 1GB`)
      return
    }

    setVideoFile(file)

    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    video.muted = true
    video.preload = 'metadata'

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2)
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)

      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
      setVideoThumbnail(thumbnailUrl)
      URL.revokeObjectURL(video.src)
    }
  }

  const removeVideo = () => {
    setVideoFile(null)
    setVideoThumbnail(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !date || !category) {
      setMessage({ type: 'error', text: 'Compila tutti i campi obbligatori' })
      return
    }

    if (!coverImage) {
      setMessage({ type: 'error', text: 'Carica un\'immagine di copertina' })
      return
    }

    if (type === 'video' && !videoFile) {
      setMessage({ type: 'error', text: 'Carica un video' }); return
    }
    setUploading(true)
    setProgress(0)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('category', category)
      formData.append('type', type)
      formData.append('dateISO', date)
      if (instagramUrl) {
        formData.append('instagramUrl', instagramUrl)
      }
      formData.append('cover', coverImage.file)

      images.forEach(img => {
        formData.append('images', img.file)
      })

      if (videoFile) {
        formData.append('video', videoFile)
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const apiUrl = backendUrl ? `${backendUrl}/api/admin/projects` : '/api/admin/projects'

      const response = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setProgress(Math.round(percentComplete))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText)
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Errore di rete durante l\'upload'))
        })

                  xhr.open('POST', apiUrl)
          xhr.send(formData)
      })

      const result = JSON.parse(response)

      if (!result.success) {
        throw new Error(result.error || 'Errore durante l\'upload')
      }

      setMessage({
        type: 'success',
        text: `Upload completato! Il progetto "${result.project.title}" sarà disponibile a breve.`
      })

      // Reset form
      setCategory('')
      setTitle('')
      setDate('')
      setInstagramUrl('')
      setCoverImage(null)
      setImages([])
      setVideoFile(null)
      setVideoThumbnail(null)
      setProgress(0)

      window.scrollTo({ top: 0, behavior: 'smooth' })

    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Errore durante l\'upload'
      })
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {message && (
        <div className={`mb-6 p-4 rounded-none ${
          message.type === 'success'
            ? 'bg-green-50  border border-green-200  text-green-800 '
            : 'bg-red-50  border border-red-200  text-red-800 '
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titolo */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Titolo Progetto *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-charcoal  bg-white  text-black  rounded-none focus:outline focus:outline-1 focus:outline-charcoal "
            placeholder="Es: Ritratti Urbani"
            required
            disabled={uploading}
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">Categoria *</label>
          <CategoryToggle value={category} onChange={setCategory} disabled={uploading} />
        </div>

        
        {/* Data */}
        <div
          onClick={() => !uploading && dateInputRef.current?.showPicker()}
          className="cursor-pointer border-2 border-dashed border-gray-300  p-4 rounded-none hover:border-charcoal  transition-colors"
        >
          <label htmlFor="date" className="block text-sm font-medium mb-2 cursor-pointer">
            Data Progetto *
          </label>
          <input
            ref={dateInputRef}
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-lg font-medium bg-transparent border-none outline-none cursor-pointer"
            required
            disabled={uploading}
          />
          <p className="text-xs text-gray600  mt-2">
            Clicca ovunque per aprire il calendario
          </p>
        </div>

        {/* Link Instagram */}
        <div>
          <label htmlFor="instagramUrl" className="block text-sm font-medium mb-2">
            Link Instagram (opzionale)
          </label>
          <input
            type="url"
            id="instagramUrl"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            className="w-full px-4 py-2 border border-charcoal  bg-white  text-black  rounded-none focus:outline focus:outline-1 focus:outline-charcoal "
            placeholder="https://www.instagram.com/p/..."
            disabled={uploading}
          />
        </div>

        {/* Upload Copertina */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Immagine Copertina * (1 immagine, JPG/PNG, max 50MB)
          </label>

          {!coverImage ? (
            <div className="border-2 border-dashed border-gray-300  rounded-none p-8 text-center hover:border-charcoal  transition-colors">
              <input
                type="file"
                id="cover"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleCoverChange}
                className="hidden"
                disabled={uploading || isProcessingImages}
              />
              <label
                htmlFor="cover"
                className="cursor-pointer block"
              >
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-gray700  mb-2">
                  Clicca per selezionare l'immagine di copertina
                </p>
                <p className="text-sm text-gray600 ">
                  Questa sarà l'immagine principale del progetto
                </p>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={coverImage.preview}
                alt="Cover preview"
                className="w-full max-h-64 object-cover"
              />
              <button
                type="button"
                onClick={removeCover}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-4 py-2 hover:bg-red-600 transition-colors"
                disabled={uploading}
              >
                Rimuovi
              </button>
              <p className="text-sm text-gray700  mt-2">
                📸 {coverImage.file.name}
              </p>
            </div>
          )}
        </div>

        {/* Upload Video */}
        {type === 'video' && <div>
          <label className="block text-sm font-medium mb-2">
            Video Progetto * ( MP4/WebM/MOV, max 1GB)
          </label>

          {!videoFile ? (
            <div className="border-2 border-dashed border-gray-300  rounded-none p-8 text-center hover:border-charcoal  transition-colors">
              <input
                type="file"
                id="video"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoChange}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="video"
                className="cursor-pointer block"
              >
                <div className="text-4xl mb-2">🎬</div>
                <p className="text-gray700  mb-2">
                  Clicca per selezionare un video
                </p>
                <p className="text-sm text-gray600 ">
                  Il video sarà mostrato nella pagina del progetto
                </p>
              </label>
            </div>
          ) : (
            <div className="relative">
              {videoThumbnail && (
                <img
                  src={videoThumbnail}
                  alt="Video thumbnail"
                  className="w-full max-h-64 object-cover"
                />
              )}
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-4 py-2 hover:bg-red-600 transition-colors"
                disabled={uploading}
              >
                Rimuovi
              </button>
              <div className="bg-gray-100  p-3 mt-2">
                <p className="text-sm text-gray700 ">
                  🎬 {videoFile.name}
                </p>
                <p className="text-xs text-gray600  mt-1">
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>}

        {/* Upload Galleria */}
        {type === 'photo' && <div>
          <label className="block text-sm font-medium mb-2">
            Galleria Immagini (opzionale, max 30, JPG/PNG, max 50MB ciascuna)
          </label>

          <div className="border-2 border-dashed border-gray-300  rounded-none p-8 text-center hover:border-charcoal  transition-colors">
            <input
              type="file"
              id="images"
              multiple
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageChange}
              className="hidden"
              disabled={uploading || isProcessingImages}
            />
            <label
              htmlFor="images"
              className="cursor-pointer block"
            >
              <div className="text-4xl mb-2">📸</div>
              <p className="text-gray700  mb-2">
                Clicca per aggiungere immagini alla galleria
              </p>
              <p className="text-sm text-gray600 ">
                oppure trascina qui i file
              </p>
            </label>
          </div>

          {isProcessingImages && (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray700 mt-2">Preparazione preview...</p>
            </div>
          )}

          {images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray700  mb-3">
                {images.length} {images.length === 1 ? 'immagine' : 'immagini'} nella galleria
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={uploading}
                    >
                      ×
                    </button>
                    <p className="text-xs text-gray600  mt-1 truncate">
                      {img.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>}

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200  rounded-full h-3">
              <div
                className="bg-charcoal  h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <p className="text-gray700 ">
                {progress < 100 ? 'Caricamento...' : 'Completato!'}
              </p>
              <p className="text-gray600  font-mono">
                {progress}%
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploading || isProcessingImages}
            className="btn btn-animated flex-1 disabled:opacity-50 disabled:cursor-not-allowed hover:text-white"
          >
            <span className="relative z-10">{uploading ? 'Caricamento...' : 'Crea Progetto'}</span>
          </button>

          {!uploading && (
            <button
              type="button"
              onClick={() => {
                setCategory('')
                setTitle('')
                          setDate('')
                setInstagramUrl('')
                setCoverImage(null)
                setImages([])
                setVideoFile(null)
                setVideoThumbnail(null)
                setMessage(null)
              }}
              className="btn btn-animated px-6 hover:text-white"
            >
              <span className="relative z-10">Reset</span>
            </button>
          )}
        </div>
      </form>
    </div>
  )
}


type Meta = Record<string, Partial<Photo>>
function BestPhotosTab() {
  const [meta, setMeta] = useState<Meta>({})
  const [saved, setSaved] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { request('/imagemeta').then(data => { setMeta(data.imageMeta); setSaved(JSON.stringify(data.imageMeta)) }).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  const selected = Object.keys(meta).filter(path => meta[path].isBest).sort((a,b) => (meta[a].bestOrder ?? Infinity) - (meta[b].bestOrder ?? Infinity))
  const dirty = saved !== JSON.stringify(meta)
  const move = (path: string, position: number) => {
    const order = selected.filter(item => item !== path)
    order.splice(Math.max(0, Math.min(order.length, position - 1)), 0, path)
    setMeta(prev => Object.fromEntries(Object.entries(prev).map(([key,value]) => [key, {...value, bestOrder: order.includes(key) ? order.indexOf(key) + 1 : null}])))
  }
  const save = async () => {
    setSaving(true); setError('')
    try { await request('/photos/selection', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ paths: selected }) }); setSaved(JSON.stringify(meta)) }
    catch(e) { setError(e instanceof Error ? e.message : 'Errore salvataggio') }
    finally { setSaving(false) }
  }
  if (loading) return <p role="status">Caricamento foto...</p>
  return <div className="pb-28"><p className="mb-6">{selected.length} foto per il carosello iniziale. Seleziona gli scatti e imposta il loro ordine.</p>{error && <p role="alert" className="text-red-700 mb-4">{error}</p>}<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{Object.entries(meta).map(([path,photo]) => <div key={path}><button type="button" disabled={saving} aria-pressed={!!photo.isBest} aria-label={`Seleziona ${path}`} onClick={() => setMeta(prev => ({...prev,[path]: {...prev[path], isBest: !prev[path].isBest, bestOrder: prev[path].isBest ? null : selected.length + 1}}))} className={`relative block w-full h-32 ${photo.isBest ? 'ring-4 ring-black' : 'ring-1 ring-gray-300'}`}><SmartImage photo={{...photo,id:path,src:path,originalUrl:path,alt:path}} sizes="(max-width:640px) 45vw, 20vw"/>{photo.isBest && <span className="absolute top-2 right-2 bg-black text-white px-2">{selected.indexOf(path)+1}</span>}</button>{photo.isBest && <label className="flex items-center gap-2 mt-3 text-sm">Ordine<input aria-label={`Ordine ${path}`} type="number" min="1" max={selected.length} value={selected.indexOf(path)+1} disabled={saving} onChange={e => move(path, Number(e.target.value) || 1)} className="border border-black p-1 w-16"/></label>}</div>)}</div>{dirty && <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-black p-4 shadow-lg flex items-center justify-center gap-4"><span>Modifiche da salvare</span><button disabled={saving} onClick={save} className="bg-black text-white px-6 py-3">{saving ? 'Salvataggio...' : 'Salva'}</button><button disabled={saving} onClick={() => setMeta(JSON.parse(saved))}>Annulla</button></div>}</div>
}
function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Project | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { request('/projects').then(data => setProjects(data.projects)).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!draft) return
    setBusy(true); setError('')
    try {
      const form = event.currentTarget as HTMLFormElement
      const body = new FormData(form)
      body.set('title',draft.title); body.set('dateISO',draft.dateISO); body.set('category',draft.category); body.set('type',draft.type); body.set('instagramUrl',draft.instagramUrl || '')
      const data = await request(`/projects/${draft.slug}`, {method:'PATCH',body})
      setProjects(prev => prev.map(project => project.slug === draft.slug ? data.project : project)); setDraft(null)
    } catch(e) {setError(e instanceof Error ? e.message : 'Errore salvataggio')} finally {setBusy(false)}
  }
  const remove = async (project: Project) => {
    if (!window.confirm(`Eliminare il progetto “${project.title}” e tutti i suoi file?`)) return
    setBusy(true); setError('')
    try {await request(`/projects/${project.slug}`,{method:'DELETE'}); setProjects(prev => prev.filter(p => p.slug !== project.slug)); if (draft?.slug === project.slug) setDraft(null)} catch(e) {setError(e instanceof Error ? e.message : 'Errore eliminazione')} finally {setBusy(false)}
  }
  if (loading) return <p role="status">Caricamento progetti...</p>
  return <div>{error && <p role="alert" className="text-red-700 mb-4">{error}</p>}<p className="mb-6">{projects.length} progetti disponibili</p><div className="space-y-4">{projects.map(project => <article key={project.slug} className="border border-charcoal p-4"><div className="flex justify-between items-center gap-4"><div><h2 className="text-lg font-bold">{project.title}</h2><p className="text-sm mt-1">{categoryLabel(project.category)} · {project.type === 'video' || project.hasVideo ? 'Video' : 'Foto'} · {project.dateISO}</p><p className="text-sm">{project.imageCount} foto</p></div><div className="flex gap-3"><button disabled={busy} aria-label={`Modifica ${project.title}`} aria-expanded={draft?.slug === project.slug} aria-controls={`edit-${project.slug}`} onClick={() => setDraft(draft?.slug === project.slug ? null : {...project,type:project.type || (project.hasVideo ? 'video' : 'photo')})} className="p-2 border border-black"><Icon name="edit"/></button><button disabled={busy} aria-label={`Elimina ${project.title}`} onClick={() => remove(project)} className="p-2 border border-red-700 text-red-700"><Icon name="delete"/></button></div></div>{draft?.slug === project.slug && <form id={`edit-${project.slug}`} onSubmit={save} className="mt-5 pt-5 border-t space-y-4"><fieldset disabled={busy} className="space-y-4"><label className="block">Titolo<input required value={draft.title} onChange={e => setDraft({...draft,title:e.target.value})} className="block border border-black p-2 w-full"/></label><label className="block">Data<input required type="date" value={draft.dateISO} onChange={e => setDraft({...draft,dateISO:e.target.value})} className="block border border-black p-2"/></label><div><p className="mb-2">Categoria</p><CategoryToggle value={draft.category} onChange={category => setDraft({...draft,category})}/></div><label className="block">Tipo<select value={draft.type} onChange={e => setDraft({...draft,type:e.target.value as Project['type']})} className="block border border-black p-2"><option value="photo">Foto</option><option value="video">Video</option></select></label><label className="block">Link Instagram<input type="url" value={draft.instagramUrl || ''} onChange={e => setDraft({...draft,instagramUrl:e.target.value})} className="block border border-black p-2 w-full"/></label><ProjectMediaEditor key={draft.slug} project={project} type={draft.type} /><div className="flex gap-4"><button type="submit" className="bg-black text-white px-6 py-2">{busy ? 'Salvataggio...' : 'Salva'}</button><button type="button" onClick={() => setDraft(null)}>Annulla</button></div></fieldset></form>}</article>)}</div></div>
}
