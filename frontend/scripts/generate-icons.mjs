import sharp from 'sharp';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const {data, info} = await sharp(root+'branding/logo-mark.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
// Keep the original mark and antialiasing; normalize the ink to black.
for(let i=0;i<data.length;i+=4) data[i]=data[i+1]=data[i+2]=0;
const mark=await sharp(data,{raw:info}).trim().png().toBuffer();
async function icon(size,fraction=0.76){
 const inset=Math.round(size*fraction);
 const ink=await sharp(mark).resize(inset,inset,{fit:'inside'}).png().toBuffer();
 return sharp({create:{width:size,height:size,channels:3,background:'#f4f2ed'}}).composite([{input:ink,gravity:'centre'}]).removeAlpha().png().toBuffer();
}
for(const [name,size,fraction] of [['favicon-16.png',16],['favicon-32.png',32],['favicon-48.png',48],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512,0.60],['mstile-150.png',150],['logo.png',512]]) await fs.writeFile(root+'public/'+name,await icon(size,fraction));
const frames=await Promise.all([16,32,48].map(size=>icon(size)));
const header=Buffer.alloc(6+16*frames.length);
header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);
let offset=header.length;
frames.forEach((frame,i)=>{const e=6+i*16;header[e]=header[e+1]=[16,32,48][i];header.writeUInt16LE(1,e+4);header.writeUInt16LE(32,e+6);header.writeUInt32LE(frame.length,e+8);header.writeUInt32LE(offset,e+12);offset+=frame.length});
await fs.writeFile(root+'public/favicon.ico',Buffer.concat([header,...frames]));
