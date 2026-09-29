import {getChatGPTUser} from '@/app/chatgpt-auth';
import {audit,observe,moderateText,operationalConfig} from '@/db/operations';
import {db,files} from '@/db/raw';
import {imageMime,MAX_IMAGE_BYTES} from './image-format';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const fields='id,sender,name,client_id AS clientId,body,created,attachment_mime AS attachmentMime,attachment_name AS attachmentName,attachment_size AS attachmentSize';
async function boundedBody(req:Request){
 const reader=req.body?.getReader();if(!reader)return new Uint8Array();
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>MAX_IMAGE_BYTES+65536){await reader.cancel();throw new Error('too-large')}chunks.push(part.value)}
 const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length}return result;
}
export const POST=(req:Request)=>observe(req,handle,'/api/chat-attachment');
async function handle(req:Request){
 try{
  const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return reply({error:'Origem não autorizada.'},403);
  const user=await getChatGPTUser();if(!user)return reply({error:'Entre na sua conta.'},401);
  const bytes=await boundedBody(req);const contentType=req.headers.get('content-type')||'';
  let b:any,file:File|null=null;
  if(contentType.startsWith('multipart/form-data')){
   const form=await new Response(bytes,{headers:{'Content-Type':contentType}}).formData();
   b=Object.fromEntries(['room','id','token','clientId','body'].map(key=>[key,form.get(key)]));
   const candidate=form.get('file');if(candidate&&typeof candidate!=='string')file=candidate;
  }else b=JSON.parse(new TextDecoder().decode(bytes));
  if(!b||typeof b.room!=='string'||typeof b.id!=='string'||typeof b.token!=='string')return reply({error:'Entre na sala para acessar anexos.'},401);
  const d=db(),now=Date.now();
  const room=await d.prepare('SELECT id FROM rooms WHERE id=? AND expires>?').bind(b.room,now).first();
  if(!room)return reply({error:'Sala encerrada.'},404);
  const me=await d.prepare('SELECT id,name FROM members WHERE room=? AND id=? AND token=? AND seen>? AND suspended=0 AND account_id=?').bind(b.room,b.id,b.token,now-180000,user.userId).first<{id:string;name:string}>();
  if(!me)return reply({error:'Reconecte à sala para acessar anexos.'},401);
  if(b.action==='download'){
   if(!Number.isSafeInteger(b.messageId))return reply({error:'Anexo inválido.'},400);
   const message=await d.prepare('SELECT attachment_key AS key,attachment_mime AS mime FROM chat_messages WHERE room=? AND id=?').bind(b.room,b.messageId).first<{key:string;mime:string}>();
   if(!message?.key)return reply({error:'Imagem não encontrada.'},404);
   const object=await files().get(message.key);if(!object)return reply({error:'Imagem indisponível.'},404);
   return new Response(object.body,{headers:{'Content-Type':message.mime,'Content-Length':String(object.size),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'}});
  }
  if(!file||!file.size||file.size>MAX_IMAGE_BYTES)return reply({error:'Escolha uma imagem de até 5 MB.'},400);
  const body=typeof b.body==='string'?b.body.trim():'';
  if(body.length>2000||typeof b.clientId!=='string'||!/^[a-f0-9]{32}$/.test(b.clientId))return reply({error:'Mensagem inválida.'},400);
  const lookup=()=>d.prepare(`SELECT ${fields} FROM chat_messages WHERE room=? AND sender=? AND client_id=?`).bind(b.room,me.id,b.clientId).first();
  const existing=await lookup();if(existing)return reply({message:existing});
  if(operationalConfig().moderationRequired)return reply({error:'Anexos temporariamente bloqueados: o serviço de revisão de imagens e GIFs ainda não está configurado.'},503);
  if(body)await moderateText(body,me.id,b.room);
  const data=new Uint8Array(await file.arrayBuffer()),mime=imageMime(data);
  if(!mime)return reply({error:'Formatos aceitos: JPG, PNG, GIF e WebP.'},400);
  const key=b.room+'/'+crypto.randomUUID();const bucket=files();
  await bucket.put(key,data,{httpMetadata:{contentType:mime}});
  try{
   const result=await d.prepare('INSERT INTO chat_messages (room,sender,name,client_id,body,created,attachment_key,attachment_mime,attachment_name,attachment_size) SELECT ?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM chat_messages WHERE room=? AND sender=? AND created>?) AND (SELECT COALESCE(SUM(attachment_size),0) FROM chat_messages WHERE room=?)<=? ON CONFLICT(room,sender,client_id) DO NOTHING').bind(b.room,me.id,me.name,b.clientId,body,now,key,mime,file.name.slice(0,150),file.size,b.room,me.id,now-1000,b.room,100*1024*1024-file.size).run();
   if(!result.meta.changes){await bucket.delete(key);const repeated=await lookup();if(repeated)return reply({message:repeated});return reply({error:'Aguarde um segundo entre envios. O limite de imagens da sala é 100 MB.'},429)}
  }catch(e){await bucket.delete(key);throw e}
  await audit('attachment.uploaded',me.id,b.room,200,JSON.stringify({mime,size:file.size}));return reply({message:await lookup()});
 }catch(e:any){if(e.status)return reply({error:e.message},e.status);if(e instanceof Error&&e.message==='too-large')return reply({error:'A imagem deve ter até 5 MB.'},413);console.error('chat-attachment',e);return reply({error:'Não foi possível acessar o anexo. Tente novamente.'},503)}
}
