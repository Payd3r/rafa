/**
 * Utility per ridimensionare immagini client-side per preview veloce
 */

/**
 * Ridimensiona un'immagine client-side per preview leggera
 * @param file File originale
 * @param maxWidth Larghezza massima (default: 400px per preview)
 * @param quality Qualità JPEG (default: 0.8)
 * @returns Promise con Data URL ridimensionato
 */
export async function resizeImageForPreview(
  file: File,
  maxWidth: number = 400,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Crea image element
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      // Calcola dimensioni mantenendo aspect ratio
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      // Crea canvas per ridimensionare
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Canvas context non disponibile'))
        return
      }

      // Disegna immagine ridimensionata
      ctx.drawImage(img, 0, 0, width, height)

      // Converti a Data URL (molto più leggero!)
      const resizedDataUrl = canvas.toDataURL('image/jpeg', quality)

      // Cleanup
      URL.revokeObjectURL(objectUrl)

      resolve(resizedDataUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Errore nel caricamento immagine'))
    }

    img.src = objectUrl
  })
}

/**
 * Ridimensiona array di immagini in batch
 */
export async function resizeImagesForPreview(
  files: File[]
): Promise<string[]> {
  const promises = files.map((file) => resizeImageForPreview(file))
  return Promise.all(promises)
}

