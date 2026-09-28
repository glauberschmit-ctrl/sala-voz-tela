export type SavedRoom={room:{id:string;title:string;mode:'conversation'|'presentation';host:string};id:string;token:string;name:string};
const KEY='sala-open-rooms-v1';
export function parseRooms(raw:string|null):SavedRoom[]{
 try{const data=JSON.parse(raw||'[]');if(!Array.isArray(data))return [];const seen=new Set<string>();return data.filter((v:any)=>{const valid=v&&/^[a-f0-9]{32}$/.test(v.id)&&/^[a-f0-9]{64}$/.test(v.token)&&v.room&&/^[a-f0-9]{32}$/.test(v.room.id)&&/^[a-f0-9]{32}$/.test(v.room.host)&&typeof v.room.title==='string'&&['conversation','presentation'].includes(v.room.mode)&&typeof v.name==='string'&&!seen.has(v.room.id);if(valid)seen.add(v.room.id);return valid})}catch{return []}
}
export function readRooms(){try{return parseRooms(localStorage.getItem(KEY))}catch{return []}}
export function writeRooms(rooms:SavedRoom[]){try{localStorage.setItem(KEY,JSON.stringify(rooms));return true}catch{return false}}

export function localId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('')}
