import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react'
import { Header } from '../shared/Header'
import { Footer } from '../shared/Footer'
import { resizeImageForPreview, resizeImagesForPreview } from '../shared/utils/imageResize'

interface ImagePreview {
  file: File
  preview: string
}

interface Project {
  slug: string
  title: string
  dateISO: string
  description: string
  imageCount: number
  createdAt: string
  instagramUrl?: string
}

type TabType = 'upload' | 'best-photos' | 'projects'

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>('upload')

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <Header />
      
      <main className="section-y">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="h1-hero text-4xl sm:text-5xl font-bold mb-4">
              Admin Panel
            </h1>
            <p className="text-gray700 dark:text-gray-300">
              Gestisci i tuoi progetti e le foto migliori
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-charcoal dark:border-white mb-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'border-b-2 border-charcoal dark:border-white text-charcoal dark:text-white'
                  : 'text-gray700 dark:text-gray-300 hover:text-charcoal dark:hover:text-white'
              }`}
            >
              Carica Progetto
            </button>
            <button
              onClick={() => setActiveTab('best-photos')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'best-photos'
                  ? 'border-b-2 border-charcoal dark:border-white text-charcoal dark:text-white'
                  : 'text-gray700 dark:text-gray-300 hover:text-charcoal dark:hover:text-white'
              }`}
            >
              Migliori Foto
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'projects'
                  ? 'border-b-2 border-charcoal dark:border-white text-charcoal dark:text-white'
                  : 'text-gray700 dark:text-gray-300 hover:text-charcoal dark:hover:text-white'
              }`}
            >
              Gestione Progetti
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'upload' && <UploadTab />}
          {activeTab === 'best-photos' && <BestPhotosTab />}
          {activeTab === 'projects' && <ProjectsTab />}
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ============================================
// TAB 1: UPLOAD PROGETTO
// ============================================
function UploadTab() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
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
      video.currentTime = 1
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
    
    if (!title || !description || !date) {
      setMessage({ type: 'error', text: 'Compila tutti i campi obbligatori' })
      return
    }

    if (!coverImage) {
      setMessage({ type: 'error', text: 'Carica un\'immagine di copertina' })
      return
    }

    setUploading(true)
    setProgress(0)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
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
      setTitle('')
      setDescription('')
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
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500 text-red-800 dark:text-red-200'
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
            className="w-full px-4 py-2 border border-charcoal dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-none focus:outline focus:outline-1 focus:outline-charcoal dark:focus:outline-white"
            placeholder="Es: Ritratti Urbani"
            required
            disabled={uploading}
          />
        </div>

        {/* Descrizione */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Descrizione *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-charcoal dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-none focus:outline focus:outline-1 focus:outline-charcoal dark:focus:outline-white"
            placeholder="Descrivi il progetto fotografico..."
            required
            disabled={uploading}
          />
        </div>

        {/* Data */}
        <div 
          onClick={() => !uploading && dateInputRef.current?.showPicker()}
          className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-white p-4 rounded-none hover:border-charcoal dark:hover:border-white transition-colors"
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
          <p className="text-xs text-gray600 dark:text-gray-400 mt-2">
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
            className="w-full px-4 py-2 border border-charcoal dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-none focus:outline focus:outline-1 focus:outline-charcoal dark:focus:outline-white"
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
            <div className="border-2 border-dashed border-gray-300 dark:border-white rounded-none p-8 text-center hover:border-charcoal dark:hover:border-white transition-colors">
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
                <p className="text-gray700 dark:text-gray-300 mb-2">
                  Clicca per selezionare l'immagine di copertina
                </p>
                <p className="text-sm text-gray600 dark:text-gray-400">
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
              <p className="text-sm text-gray700 dark:text-gray-300 mt-2">
                📸 {coverImage.file.name}
              </p>
            </div>
          )}
        </div>

        {/* Upload Video */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Video Progetto (opzionale, MP4/WebM/MOV, max 1GB)
          </label>
          
          {!videoFile ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-white rounded-none p-8 text-center hover:border-charcoal dark:hover:border-white transition-colors">
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
                <p className="text-gray700 dark:text-gray-300 mb-2">
                  Clicca per selezionare un video
                </p>
                <p className="text-sm text-gray600 dark:text-gray-400">
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
              <div className="bg-gray-100 dark:bg-gray-800 p-3 mt-2">
                <p className="text-sm text-gray700 dark:text-gray-300">
                  🎬 {videoFile.name}
                </p>
                <p className="text-xs text-gray600 dark:text-gray-400 mt-1">
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Galleria */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Galleria Immagini (opzionale, max 30, JPG/PNG, max 50MB ciascuna)
          </label>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-white rounded-none p-8 text-center hover:border-charcoal dark:hover:border-white transition-colors">
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
              <p className="text-gray700 dark:text-gray-300 mb-2">
                Clicca per aggiungere immagini alla galleria
              </p>
              <p className="text-sm text-gray600 dark:text-gray-400">
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
              <p className="text-sm text-gray700 dark:text-gray-300 mb-3">
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
                    <p className="text-xs text-gray600 dark:text-gray-400 mt-1 truncate">
                      {img.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-charcoal dark:bg-white h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <p className="text-gray700 dark:text-gray-300">
                {progress < 100 ? 'Caricamento...' : 'Completato!'}
              </p>
              <p className="text-gray600 dark:text-gray-400 font-mono">
                {progress}%
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploading}
            className="btn btn-animated flex-1 disabled:opacity-50 disabled:cursor-not-allowed hover:text-white"
          >
            <span className="relative z-10">{uploading ? 'Caricamento...' : 'Crea Progetto'}</span>
          </button>
          
          {!uploading && (
            <button
              type="button"
              onClick={() => {
                setTitle('')
                setDescription('')
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

// ============================================
// TAB 2: MIGLIORI FOTO
// ============================================
function BestPhotosTab() {
  const [imageMeta, setImageMeta] = useState<Record<string, { ratio: number; placeholder: string; isBest?: boolean }>>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchImageMeta()
  }, [])

  const fetchImageMeta = async () => {
    try {
      setLoading(true)
              const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
        const apiUrl = backendUrl ? `${backendUrl}/api/admin/imagemeta` : '/api/admin/imagemeta'
        
        const response = await fetch(apiUrl)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

      const data = await response.json()
      const imageMetaData = data.imageMeta || {}
      
      // Debug: log per vedere cosa viene caricato
      const bestCount = Object.values(imageMetaData).filter((m: any) => m?.isBest === true).length
      console.log('📥 Admin - imageMeta caricato:', {
        total: Object.keys(imageMetaData).length,
        bestCount,
        sample: Object.keys(imageMetaData).slice(0, 5)
      })
      
      setImageMeta(imageMetaData)
    } catch (error) {
      console.error('Errore caricamento imageMeta:', error)
      alert('Errore nel caricamento delle foto')
    } finally {
      setLoading(false)
    }
  }

  const toggleBest = async (photoPath: string) => {
    const currentValue = imageMeta[photoPath]?.isBest || false
    const newValue = !currentValue

    console.log('🔄 Toggle isBest:', {
      photoPath,
      currentValue,
      newValue,
      existingMeta: imageMeta[photoPath]
    })

    // Optimistic update
    setImageMeta(prev => ({
      ...prev,
      [photoPath]: {
        ...prev[photoPath],
        isBest: newValue
      }
    }))

    setUpdating(photoPath)

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const apiUrl = backendUrl ? `${backendUrl}/api/admin/photos` : '/api/admin/photos'
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          photoPath,
          isBest: newValue
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Errore aggiornamento')
      }

      const result = await response.json()
      console.log(`✅ Foto ${photoPath} aggiornata: isBest=${newValue}`, result)
      
      // Ricarica imageMeta per assicurarsi di avere i dati aggiornati
      await fetchImageMeta()
    } catch (error) {
      console.error('Errore toggle best:', error)
      // Rollback su errore
      setImageMeta(prev => ({
        ...prev,
        [photoPath]: {
          ...prev[photoPath],
          isBest: currentValue
        }
      }))
      alert('Errore nell\'aggiornamento della foto')
    } finally {
      setUpdating(null)
    }
  }

  const photoEntries = Object.entries(imageMeta)
  const bestCount = photoEntries.filter(([, meta]) => meta.isBest).length

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-charcoal dark:border-white border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray700 dark:text-gray-300">Caricamento foto...</p>
      </div>
    )
  }

  if (photoEntries.length === 0) {
    return (
      <div className="text-center py-12 text-gray700 dark:text-gray-300">
        Nessuna foto disponibile. Carica prima alcuni progetti.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-none">
        <p className="text-sm text-gray700 dark:text-gray-300">
          <strong>{bestCount}</strong> foto selezionate come "migliori scatti" su <strong>{photoEntries.length}</strong> totali
        </p>
        <p className="text-xs text-gray600 dark:text-gray-400 mt-1">
          Clicca su una foto per aggiungerla o rimuoverla dai migliori scatti
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photoEntries.map(([photoPath, meta]) => (
          <button
            key={photoPath}
            onClick={() => toggleBest(photoPath)}
            disabled={updating === photoPath}
            className="relative group cursor-pointer disabled:opacity-50"
          >
            <img
              src={photoPath}
              alt={photoPath}
              className={`w-full h-32 object-cover transition-all ${
                meta.isBest
                  ? 'ring-4 ring-green-500 dark:ring-green-400'
                  : 'ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-2 hover:ring-charcoal dark:hover:ring-white'
              }`}
            />
            {meta.isBest && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            )}
            {updating === photoPath && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <p className="text-xs text-gray600 dark:text-gray-400 mt-1 truncate">
              {photoPath.split('/').pop()}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// TAB 3: GESTIONE PROGETTI
// ============================================
function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editingDescription, setEditingDescription] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editingInstagram, setEditingInstagram] = useState<string | null>(null)
  const [editInstagramUrl, setEditInstagramUrl] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
              const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
        const apiUrl = backendUrl ? `${backendUrl}/api/admin/projects` : '/api/admin/projects'
        
        const response = await fetch(apiUrl)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

      const data = await response.json()
      setProjects(data.projects)
    } catch (error) {
      console.error('Errore caricamento progetti:', error)
      alert('Errore nel caricamento dei progetti')
    } finally {
      setLoading(false)
    }
  }

  const updateDate = async (slug: string) => {
    if (!editDate) {
      alert('Seleziona una data valida')
      return
    }

    setUpdating(slug)

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const apiUrl = backendUrl ? `${backendUrl}/api/admin/projects/${slug}` : `/api/admin/projects/${slug}`
      
              const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ dateISO: editDate })
        })

        if (!response.ok) {
          throw new Error('Errore aggiornamento')
        }

        alert('Data aggiornata con successo!')
      setEditing(null)
      setEditDate('')
      
      // Ricarica lista
      await fetchProjects()
    } catch (error) {
      console.error('Errore aggiornamento data:', error)
      alert('Errore nell\'aggiornamento della data')
    } finally {
      setUpdating(null)
    }
  }

  const updateDescription = async (slug: string) => {
    if (!editDescription.trim()) {
      alert('La descrizione non può essere vuota')
      return
    }

    setUpdating(slug)

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const apiUrl = backendUrl ? `${backendUrl}/api/admin/projects/${slug}` : `/api/admin/projects/${slug}`
      
              const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ description: editDescription })
        })

        if (!response.ok) {
          throw new Error('Errore aggiornamento')
        }

        alert('Descrizione aggiornata con successo!')
      setEditingDescription(null)
      setEditDescription('')
      
      // Ricarica lista
      await fetchProjects()
    } catch (error) {
      console.error('Errore aggiornamento descrizione:', error)
      alert('Errore nell\'aggiornamento della descrizione')
    } finally {
      setUpdating(null)
    }
  }

  const updateInstagramUrl = async (slug: string) => {
    setUpdating(slug)

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const apiUrl = backendUrl ? `${backendUrl}/api/admin/projects/${slug}` : `/api/admin/projects/${slug}`
      
              const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ instagramUrl: editInstagramUrl || null })
        })

        if (!response.ok) {
          throw new Error('Errore aggiornamento')
        }

        alert('Link Instagram aggiornato con successo!')
      setEditingInstagram(null)
      setEditInstagramUrl('')
      
      // Ricarica lista
      await fetchProjects()
    } catch (error) {
      console.error('Errore aggiornamento link Instagram:', error)
      alert('Errore nell\'aggiornamento del link Instagram')
    } finally {
      setUpdating(null)
    }
  }

  const deleteProject = async (slug: string, title: string) => {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare il progetto "${title}"?\n\nQuesta azione è IRREVERSIBILE e cancellerà:\n- Tutte le foto del progetto\n- Il video (se presente)\n- Tutti i metadati\n\nContinuare?`
    )

    if (!confirmed) return

    setDeleting(slug)

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const apiUrl = backendUrl ? `${backendUrl}/api/admin/projects/${slug}` : `/api/admin/projects/${slug}`
      
      const response = await fetch(apiUrl, {
                  method: 'DELETE'
        })

      if (!response.ok) {
        throw new Error('Errore eliminazione')
      }

      const data = await response.json()
      alert(`Progetto "${title}" eliminato con successo!\n\nProgetti rimanenti: ${data.remainingProjects}`)
      
      // Ricarica lista
      await fetchProjects()
    } catch (error) {
      console.error('Errore eliminazione progetto:', error)
      alert('Errore nell\'eliminazione del progetto')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-charcoal dark:border-white border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray700 dark:text-gray-300">Caricamento progetti...</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-gray700 dark:text-gray-300">
        Nessun progetto disponibile.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-none">
        <p className="text-sm text-gray700 dark:text-gray-300">
          <strong>{projects.length}</strong> {projects.length === 1 ? 'progetto' : 'progetti'} disponibili
        </p>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.slug}
            className="flex items-center justify-between p-4 border border-charcoal dark:border-white rounded-none"
          >
            <div className="flex-1">
              <h3 className="font-bold text-lg">{project.title}</h3>
              
              {editing === project.slug ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="px-3 py-1 border border-charcoal dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-none"
                    disabled={updating === project.slug}
                  />
                  <button
                    onClick={() => updateDate(project.slug)}
                    disabled={updating === project.slug}
                    className="px-3 py-1 bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {updating === project.slug ? (
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvataggio...
                      </span>
                    ) : (
                      'Salva'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(null)
                      setEditDate('')
                    }}
                    disabled={updating === project.slug}
                    className="px-3 py-1 bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray700 dark:text-gray-300 mt-1">
                  {new Date(project.dateISO).toLocaleDateString('it-IT')} • {project.imageCount} foto
                </p>
              )}
              
              {editingDescription === project.slug ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-1 border border-charcoal dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-none"
                    disabled={updating === project.slug}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateDescription(project.slug)}
                      disabled={updating === project.slug}
                      className="px-3 py-1 bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {updating === project.slug ? (
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Salvataggio...
                        </span>
                      ) : (
                        'Salva'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingDescription(null)
                        setEditDescription('')
                      }}
                      disabled={updating === project.slug}
                      className="px-3 py-1 bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray700 dark:text-gray-300 mt-2 max-w-2xl">
                  {project.description}
                </p>
              )}
              
              {editingInstagram === project.slug ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={editInstagramUrl}
                    onChange={(e) => setEditInstagramUrl(e.target.value)}
                    className="flex-1 px-3 py-1 border border-charcoal dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-none"
                    placeholder="https://www.instagram.com/p/..."
                    disabled={updating === project.slug}
                  />
                  <button
                    onClick={() => updateInstagramUrl(project.slug)}
                    disabled={updating === project.slug}
                    className="px-3 py-1 bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {updating === project.slug ? (
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvataggio...
                      </span>
                    ) : (
                      'Salva'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingInstagram(null)
                      setEditInstagramUrl('')
                    }}
                    disabled={updating === project.slug}
                    className="px-3 py-1 bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm"
                  >
                    Annulla
                  </button>
                </div>
              ) : null}
              
              <p className="text-xs text-gray600 dark:text-gray-400 mt-1">
                Slug: {project.slug}
              </p>
            </div>
            
            <div className="flex gap-2 ml-4 flex-wrap">
              {editing !== project.slug && editingDescription !== project.slug && editingInstagram !== project.slug && (
                <>
                  <button
                    onClick={() => {
                      setEditing(project.slug)
                      setEditDate(project.dateISO)
                    }}
                    disabled={deleting === project.slug}
                    className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Modifica Data
                  </button>
                  <button
                    onClick={() => {
                      setEditingDescription(project.slug)
                      setEditDescription(project.description)
                    }}
                    disabled={deleting === project.slug}
                    className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Modifica Descrizione
                  </button>
                  <button
                    onClick={() => {
                      setEditingInstagram(project.slug)
                      setEditInstagramUrl(project.instagramUrl || '')
                    }}
                    disabled={deleting === project.slug}
                    className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Modifica Link IG
                  </button>
                  <button
                    onClick={() => deleteProject(project.slug, project.title)}
                    disabled={deleting === project.slug}
                    className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === project.slug ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Eliminazione...
                      </span>
                    ) : (
                      'Elimina'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
