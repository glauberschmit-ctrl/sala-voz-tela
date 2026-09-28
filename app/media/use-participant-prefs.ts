'use client';
import {useEffect,useRef,useState} from 'react';
import {normalizeParticipant,type ParticipantPrefs} from './participant-audio';
type Saved={room:string;people:Record<string,ParticipantPrefs>};
export function useParticipantPrefs(room:string){
 const [saved,setSaved]=useState<Saved>({room:'',people:{}}),ref=useRef(saved),[error,setError]=useState('');
 useEffect(()=>{let people:Record<string,ParticipantPrefs>={};try{const data=JSON.parse(localStorage.getItem('sala-participants-'+room)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))people=Object.fromEntries(Object.entries(data).filter(([id])=>/^[a-f0-9]{32}$/.test(id)).map(([id,p])=>[id,normalizeParticipant(p as Partial<ParticipantPrefs>)]))}catch{}const next={room,people};ref.current=next;setSaved(next);setError('')},[room]);
 function get(id:string){return normalizeParticipant(saved.room===room?saved.people[id]:undefined)}
 function update(id:string,patch:Partial<ParticipantPrefs>){const people=ref.current.room===room?ref.current.people:{};const next={room,people:{...people,[id]:normalizeParticipant({...normalizeParticipant(people[id]),...patch})}};ref.current=next;setSaved(next);try{localStorage.setItem('sala-participants-'+room,JSON.stringify(next.people));setError('')}catch{setError('O ajuste funciona agora, mas não pôde ser salvo neste dispositivo.')}}
 return {get,update,error};
}
