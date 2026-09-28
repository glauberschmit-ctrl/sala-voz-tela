'use client';
import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {localId} from './saved-rooms';
import ChatImage from './chat-image';
import {MessageSquare,Send,ChevronDown,ChevronUp,Paperclip,X} from 'lucide-react';
type Message={id:number;sender:string;name:string;clientId:string;body:string;created:number;attachmentMime?:string;attachmentName?:string};
type Session={room:{id:string};id:string;token:string};
const merge=(old:Message[],incoming:Message[])=>[...new Map([...old,...incoming].map(m=>[m.id,m])).values()].sort((a,b)=>a.id-b.id);
export default function RoomChat({session,active=true,onUnread}:{session:Session;active?:boolean;onUnread?:(n:number)=>void}){
 const id=useId(),activeRef=useRef(active),notify=useRef(onUnread);activeRef.current=active;notify.current=onUnread;
 const [messages,setMessages]=useState<Message[]>([]),[draft,setDraft]=useState(''),[open,setOpen]=useState(true),[unread,setUnread]=useState(0);
 const [loading,setLoading]=useState(true),[sending,setSending]=useState(false),[older,setOlder]=useState(false),[loadingOlder,setLoadingOlder]=useState(false),[error,setError]=useState(''),[connection,setConnection]=useState('');
 const [attachment,setAttachment]=useState<File|null>(null);const fileInput=useRef<HTMLInputElement>(null);
 const list=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null),isOpen=useRef(true),atBottom=useRef(true),scrollNext=useRef(false),seen=useRef(new Set<number>());
 const preserved=useRef<{height:number;top:number}|null>(null),retry=useRef<{body:string;clientId:string}|null>(null),sendLock=useRef(false);
 const abort=useRef<AbortController|null>(null);
 useEffect(()=>{notify.current?.(unread)},[unread]);
 useEffect(()=>{if(active&&isOpen.current&&atBottom.current){setUnread(0);if(list.current)list.current.scrollTop=list.current.scrollHeight}},[active]);
 const auth={room:session.room.id,id:session.id,token:session.token};
 async function request(body:Record<string,unknown>,signal?:AbortSignal){
  const response=await fetch('/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...auth,...body}),signal});
  const data:any=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível acessar o chat.');return data;
 }
 function receive(incoming:Message[],initial=false){
  const fresh=incoming.filter(m=>!seen.current.has(m.id));incoming.forEach(m=>seen.current.add(m.id));
  if(!initial&&(!activeRef.current||!isOpen.current||!atBottom.current||document.visibilityState==='hidden'))setUnread(n=>n+fresh.filter(m=>m.sender!==session.id).length);
  if(initial||(activeRef.current&&isOpen.current&&atBottom.current))scrollNext.current=true;
  setMessages(old=>merge(old,incoming));
 }
 useEffect(()=>{
  const controller=new AbortController();abort.current=controller;let timer:ReturnType<typeof setTimeout>,initialized=false,cursor=0;
  async function poll(){
   try{
    const data=await request({action:'chat_list',...(initialized?{after:cursor}:{})},controller.signal);
    if(controller.signal.aborted)return;
    receive(data.messages,!initialized);
    if(!initialized)setOlder(data.hasOlder);
    for(const message of data.messages)cursor=Math.max(cursor,message.id);
    initialized=true;setLoading(false);setConnection('');
   }catch{if(controller.signal.aborted)return;setConnection('Chat desconectado. Tentando novamente…');setLoading(false)}
   timer=setTimeout(poll,1500);
  }
  void poll();return()=>{controller.abort();clearTimeout(timer)};
 },[session.room.id,session.id,session.token]);
 useLayoutEffect(()=>{
  const el=list.current;if(!el)return;
  if(preserved.current){el.scrollTop=preserved.current.top+el.scrollHeight-preserved.current.height;preserved.current=null;return}
  if(scrollNext.current){el.scrollTop=el.scrollHeight;atBottom.current=true;scrollNext.current=false}
 },[messages,open]);
 function bottom(){scrollNext.current=true;atBottom.current=true;setUnread(0);if(list.current)list.current.scrollTop=list.current.scrollHeight}
 function toggle(){isOpen.current=!isOpen.current;setOpen(isOpen.current);if(isOpen.current)bottom()}
 async function loadOlder(){
  if(loadingOlder||!messages.length)return;setLoadingOlder(true);setError('');
  try{
   const data=await request({action:'chat_list',before:messages[0].id},abort.current?.signal);
   if(abort.current?.signal.aborted)return;
   const el=list.current;if(el)preserved.current={height:el.scrollHeight,top:el.scrollTop};
   data.messages.forEach((m:Message)=>seen.current.add(m.id));setMessages(old=>merge(old,data.messages));setOlder(data.hasOlder);
  }catch(e){if(!abort.current?.signal.aborted)setError(e instanceof Error?e.message:'Não foi possível carregar o histórico.')}finally{setLoadingOlder(false)}
 }
 async function send(){
  const body=draft.trim();if((!body&&!attachment)||body.length>2000||sendLock.current)return;
  sendLock.current=true;setSending(true);setError('');
  if(retry.current?.body!==body)retry.current={body,clientId:localId()};
  try{
   let data:any;
   if(attachment){const form=new FormData();for(const [key,value] of Object.entries({...auth,...retry.current!}))form.append(key,value);form.append('file',attachment);const response=await fetch('/api/chat-attachment',{method:'POST',body:form,signal:abort.current?.signal});data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível enviar a imagem.');}
   else data=await request({action:'chat_send',...retry.current},abort.current?.signal);
   if(abort.current?.signal.aborted)return;
   receive([data.message]);setDraft('');setAttachment(null);if(fileInput.current)fileInput.current.value='';retry.current=null;bottom();
  }catch(e){if(!abort.current?.signal.aborted)setError(e instanceof Error?e.message:'Mensagem não enviada. Tente novamente.')}finally{sendLock.current=false;setSending(false);input.current?.focus()}
 }
 return <section className="room-chat" aria-label="Chat da sala">
  <button type="button" className="chat-heading" onClick={toggle} aria-expanded={open} aria-controls={id+'-content'}><span><MessageSquare size={18}/> Chat da sala {unread>0&&<b className="chat-badge" aria-label={`${unread} mensagens não lidas`}>{unread>99?'99+':unread}</b>}</span>{open?<ChevronDown size={17}/>:<ChevronUp size={17}/>}</button>
  {open&&<div id={id+'-content'}><p className="chat-help">Todos podem escrever, mesmo sem microfone.</p>
   <div className="chat-messages" ref={list} tabIndex={0} aria-label="Histórico de mensagens" onScroll={()=>{const el=list.current;if(el){atBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<40;if(activeRef.current&&atBottom.current)setUnread(0)}}}>
    {older&&<button className="chat-older" type="button" onClick={()=>void loadOlder()} disabled={loadingOlder}>{loadingOlder?'Carregando…':'Carregar mensagens anteriores'}</button>}
    {loading&&<p className="chat-empty">Carregando conversa…</p>}
    {!loading&&!messages.length&&<p className="chat-empty">Ainda não há mensagens. Comece a conversa!</p>}
    {messages.map(m=><article className={'chat-message '+(m.sender===session.id?'own':'')} key={m.id}><header><strong>{m.sender===session.id?'Você':m.name}</strong><time dateTime={new Date(m.created).toISOString()} title={new Date(m.created).toLocaleString('pt-BR')}>{new Date(m.created).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</time></header><p>{m.body}</p>{m.attachmentMime&&<ChatImage messageId={m.id} name={m.attachmentName||'Imagem'} auth={auth}/>}</article>)}
   </div>
   {unread>0&&<button type="button" className="chat-new" onClick={bottom}>Ver {unread} mensagem{unread===1?' nova':'s novas'} ↓</button>}
   {connection&&<p className="chat-status" role="status">{connection}</p>}
   {error&&<p className="chat-error" role="alert">{error} Seu texto foi mantido.</p>}
   {attachment&&<div className="chat-selected"><span>{attachment.name} · {(attachment.size/1024/1024).toFixed(1)} MB</span><button type="button" aria-label="Remover imagem" disabled={sending} onClick={()=>{setAttachment(null);retry.current=null;if(fileInput.current)fileInput.current.value=''}}><X size={15}/></button></div>}
   <form className="chat-composer" onSubmit={e=>{e.preventDefault();void send()}}>
    <label className="sr-only" htmlFor={id+'-message'}>Mensagem para a sala</label>
    <textarea id={id+'-message'} ref={input} value={draft} maxLength={2000} rows={3} placeholder="Escreva uma mensagem…" disabled={sending} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send()}}}/>
    <input type="file" ref={fileInput} accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" aria-label="Escolher imagem" disabled={sending} onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>5*1024*1024){setError('A imagem deve ter até 5 MB.');e.target.value='';return}setAttachment(file);retry.current=null;setError('')}}/>
    <div className="chat-send-row"><button type="button" className="chat-attach" title="Anexar JPG, PNG, GIF ou WebP (até 5 MB)" aria-label="Anexar imagem ou GIF" disabled={sending} onClick={()=>fileInput.current?.click()}><Paperclip size={18}/></button><small>{draft.length}/2000 · Shift+Enter: nova linha</small><button type="submit" disabled={sending||(!draft.trim()&&!attachment)} aria-label="Enviar mensagem">{sending?'Enviando…':'Enviar'}<Send size={15}/></button></div>
   </form><p className="chat-retention">Imagens e GIFs: até 5 MB. O histórico e os anexos são apagados ao encerrar a sala.</p>
  </div>}
 </section>;
}
