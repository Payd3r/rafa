import { useSyncExternalStore } from 'react'
type Connection = EventTarget & { saveData?: boolean; effectiveType?: string; downlink?: number }
const connection = (navigator as Navigator & { connection?: Connection }).connection
function read() {return { constrained: !!connection?.saveData || ['slow-2g','2g','3g'].includes(connection?.effectiveType ?? '') || (connection?.downlink !== undefined && connection.downlink < 1), online: navigator.onLine }}
let snapshot=read()
const listeners=new Set<()=>void>()
function update(){const next=read();if(next.constrained===snapshot.constrained&&next.online===snapshot.online)return;snapshot=next;listeners.forEach(listener=>listener())}
function subscribe(listener:()=>void){
 if(!listeners.size){connection?.addEventListener('change',update);window.addEventListener('online',update);window.addEventListener('offline',update);update()}
 listeners.add(listener)
 return ()=>{listeners.delete(listener);if(!listeners.size){connection?.removeEventListener('change',update);window.removeEventListener('online',update);window.removeEventListener('offline',update)}}
}
export function useConnection(){return useSyncExternalStore(subscribe,()=>snapshot)}
