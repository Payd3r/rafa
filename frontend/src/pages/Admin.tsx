import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Header } from '../shared/Header'
import { Footer } from '../shared/Footer'
import { resizeImageForPreview, resizeImagesForPreview } from '../shared/utils/imageResize'

interface ImagePreview {
  file: File
  preview: string
}

export default function Admin() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [coverImage, setCoverImage] = useState<ImagePreview | null>(null)
  const [images, setImages] = useState<ImagePreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isProcessingImages, setIsProcessingImages] = useState(false)

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
      // 🔥 Ridimensiona per preview leggera (600px, qualità 0.85)
      const previewUrl = await resizeImageForPreview(file, 600, 0.85)
      
      setCoverImage({
        file, // File originale per upload
        preview: previewUrl // Data URL ridimensionato per preview
      })
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
      // 🔥 Ridimensiona tutte le immagini in batch (400px, qualità 0.8)
      const previewUrls = await resizeImagesForPreview(validFiles)
      
      const newPreviews: ImagePreview[] = validFiles.map((file, index) => ({
        file, // File originale per upload
        preview: previewUrls[index] // Data URL ridimensionato
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
      
      // Cover image (obbligatoria)
      formData.append('cover', coverImage.file)

      // Gallery images (opzionale)
      images.forEach(img => {
        formData.append('images', img.file)
      })

      // 🔥 Usa path relativo in produzione, URL completo in dev
      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const apiUrl = backendUrl ? `${backendUrl}/api/admin/projects` : '/api/admin/projects'

      // 🔥 XMLHttpRequest per progress reale
      const response = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        
        // Progress dell'upload (reale!)
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setProgress(Math.round(percentComplete))
          }
        })
        
        // Completamento
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText)
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
          }
        })
        
        // Errore
        xhr.addEventListener('error', () => {
          reject(new Error('Errore di rete durante l\'upload'))
        })
        
        // Invio
        xhr.open('POST', apiUrl)
        xhr.setRequestHeader('Authorization', 'Basic ' + btoa('andrea:andrea2004'))
        xhr.send(formData)
      })

      const result = JSON.parse(response)

      if (!result.success) {
        throw new Error(result.error || 'Errore durante l\'upload')
      }

      // 🔥 SUCCESSO IMMEDIATO
      setMessage({ 
        type: 'success', 
        text: `Upload completato! Il progetto "${result.project.title}" sarà disponibile a breve.` 
      })

      // Reset form (utente può continuare a lavorare)
      setTitle('')
      setDescription('')
      setDate('')
      setCoverImage(null)
      setImages([])
      setProgress(0)

      // Scroll in alto
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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <Header />
      
      <main className="section-y">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="h1-hero text-4xl sm:text-5xl font-bold mb-4">
              Admin Panel
            </h1>
            <p className="text-gray700 dark:text-gray-300">
              Aggiungi nuovi progetti fotografici al portfolio
            </p>
          </div>

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
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-2">
                Data Progetto *
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-charcoal dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-none focus:outline focus:outline-1 focus:outline-charcoal dark:focus:outline-white"
                required
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

              {/* Loading state durante processamento */}
              {isProcessingImages && (
                <div className="text-center py-4">
                  <div className="inline-block w-6 h-6 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray700 mt-2">Preparazione preview...</p>
                </div>
              )}

              {/* Preview Immagini Galleria */}
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
                    setCoverImage(null)
                    setImages([])
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
      </main>

      <Footer />
    </div>
  )
}

