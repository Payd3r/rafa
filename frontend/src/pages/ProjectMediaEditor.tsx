import { useEffect, useRef, useState } from 'react'
import './projectMediaEditor.css'

type MediaProject = {
  slug: string; imageCount: number; galleryIndices?: number[];
  hasCover?: boolean; coverImageIndex?: string; hasVideo?: boolean;
}
function TrashIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg>
}
export function ProjectMediaEditor({ project, type }: { project: MediaProject; type: 'photo' | 'video' }) {
  const indices = project.galleryIndices || Array.from({length:project.imageCount}, (_, i) => i + 1)
  const [kept, setKept] = useState(indices)
  const [cover, setCover] = useState(project.coverImageIndex || (project.hasCover ? 'cover' : '1'))
  const coverInput = useRef<HTMLInputElement>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  useEffect(() => {
    const url = coverFile ? URL.createObjectURL(coverFile) : ''
    setCoverPreview(url)
    return () => {if (url) URL.revokeObjectURL(url)}
  }, [coverFile])
  const [choosing, setChoosing] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [files])
  const src = (id: string | number) => `/optimized/${project.slug}/${id}/thumb.avif`
  return <div className="space-y-4">
    <input type="hidden" name="retainedImages" value={JSON.stringify(kept)}/>
    <input type="hidden" name="coverImageIndex" value={cover}/>
    <div><p className="mb-2">Copertina</p><img src={coverPreview || src(cover)} alt="Copertina selezionata" className="h-32 w-40 object-cover"/>
      <button type="button" aria-expanded={choosing} onClick={() => setChoosing(!choosing)} className="border border-black px-4 py-2 mt-2">Sostituisci copertina</button>
      <input ref={coverInput} name="cover" type="file" accept="image/jpeg,image/png" aria-label="Carica nuova copertina" className="sr-only" onChange={event => {
        const file = event.target.files?.[0]
        if (file) {setCoverFile(file); setChoosing(false)}
      }}/>
      <button type="button" onClick={() => coverInput.current?.click()} className="border border-black px-4 py-2 mt-2 ml-2">Carica nuova copertina</button>
      {coverFile && <div className="mt-2 text-sm"><span>{coverFile.name} · Da salvare</span><button type="button" className="underline ml-3" onClick={() => {setCoverFile(null); if (coverInput.current) coverInput.current.value = ''}}>Annulla nuova copertina</button></div>}
      {choosing && <div className="mt-3"><p className="mb-2">Seleziona la foto da usare come copertina</p><div className="admin-media-grid">
        {[...(project.hasCover ? ['cover'] : []), ...kept.map(String)].map(id => <button key={id} type="button" aria-label={`Usa foto ${id} come copertina`} aria-pressed={cover === id} onClick={() => {setCover(id); setCoverFile(null); if (coverInput.current) coverInput.current.value = ''; setChoosing(false)}} className={`relative ${cover === id ? 'ring-4 ring-black' : ''}`}><img src={src(id)} alt={`Foto ${id}`} className="w-full h-32 object-cover"/></button>)}
      </div></div>}
    </div>
    {type === 'photo' ? <div><p className="mb-2">Foto del progetto ({kept.length + files.length}/30)</p>
      <div className="admin-media-grid">{kept.map(id => <div key={id} className="admin-media-photo"><img src={src(id)} alt={`Foto ${id}`} className="w-full h-32 object-cover"/>
        <button type="button" className="admin-media-delete" aria-label={`Rimuovi foto ${id}`} onClick={() => {setKept(kept.filter(item => item !== id)); if (cover === String(id)) setCover(project.hasCover ? 'cover' : String(kept.find(item => item !== id) || id))}}><TrashIcon/></button>
      </div>)}{previews.map((url, i) => <div key={url} className="admin-media-photo"><img src={url} alt={`Nuova foto ${i + 1}`} className="w-full h-32 object-cover"/><span className="absolute bottom-1 left-1 bg-white px-2 text-xs">Da caricare</span><button type="button" className="admin-media-delete" aria-label={`Rimuovi nuova foto ${i + 1}`} onClick={() => setFiles(files.filter((_, index) => index !== i))}><TrashIcon/></button></div>)}</div>
      <label className="inline-block border border-black px-4 py-2 mt-3 cursor-pointer">Aggiungi foto<input aria-label="Aggiungi foto" type="file" multiple accept="image/jpeg,image/png" className="sr-only" onChange={event => { const added = Array.from(event.target.files || []); if (kept.length + files.length + added.length > 30) {window.alert('Massimo 30 foto per progetto'); return} setFiles([...files, ...added]); event.target.value = '' }}/></label>
      <input type="file" name="images" multiple hidden ref={input => {if (input) {const transfer = new DataTransfer(); files.forEach(file => transfer.items.add(file)); input.files = transfer.files}}}/>
    </div> : <label className="block">Sostituisci video<input name="video" type="file" required={!project.hasVideo} accept="video/mp4,video/webm,video/quicktime" className="block mt-2"/></label>}
    <p className="text-sm">Le modifiche alle foto vengono applicate premendo Salva.</p>
  </div>
}
