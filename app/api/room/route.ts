import {gifUrl} from '@/app/api/gifs/provider';
import {nameColors,nameFonts} from '@/app/media/name-style';
import {getUser} from '@/app/auth';
import {audit,observe,requestLimit,moderateText} from '@/db/operations';
import { db,iceConfig,deleteRoomFiles } from '@/db/raw';
const reply=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
const uid=()=>crypto.randomUUID().replaceAll('-','');
const clean=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n):'';
export const POST=(req:Request)=>observe(req,handle,'/api/room');
async function handle(req:Request){
 try{
  const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return reply({error:'Origem não autorizada.'},403);
  const user=await getUser();
  const raw=await req.text();if(raw.length>70000)return reply({error:'Pedido muito grande.'},413);
  const b=JSON.parse(raw),d=db(),now=Date.now();
  if(['create','join'].includes(b.action)&&await requestLimit(req,b.action))return reply({error:'Muitas tentativas. Aguarde um minuto.'},429);
  if(b.action==='create'){
   const name=clean(b.name,40),title=clean(b.title,70);if(!name||!title||!['conversation','presentation'].includes(b.mode))return reply({error:'Preencha seu nome, o título e o modo da sala.'},400);
   const permanent=b.permanent===true;
   if(permanent&&(!user||!await d.prepare('SELECT id FROM accounts WHERE id=?').bind(user.userId).first()))return reply({error:'Crie uma conta e entre para criar uma sala permanente.'},403);
   if(permanent&&Number((await d.prepare('SELECT COUNT(*) AS n FROM rooms WHERE owner=? AND permanent=1').bind(user!.userId).first<any>())?.n)>=10)return reply({error:'Você pode manter até 10 salas permanentes.'},409);
   const room=uid(),id=uid(),token=uid()+uid();
   const expired=await d.prepare('SELECT id FROM rooms WHERE expires<? LIMIT 20').bind(now).all<{id:string}>();
   for(const old of expired.results){await deleteRoomFiles(old.id);await d.prepare('DELETE FROM rooms WHERE id=?').bind(old.id).run();}
   await d.batch([d.prepare('INSERT INTO rooms (id,title,mode,host,expires,owner,permanent) VALUES (?,?,?,?,?,?,?)').bind(room,title,permanent?'conversation':b.mode,id,permanent?8640000000000000:now+43200000,permanent?user!.userId:null,permanent?1:0),d.prepare('INSERT INTO members (id,room,token,name,seen,account_id) VALUES (?,?,?,?,?,?)').bind(id,room,token,name,now,user?.userId??null)]);
   if(permanent)await d.prepare('INSERT OR IGNORE INTO server_accounts(room,account) VALUES(?,?)').bind(room,user!.userId).run();
   await audit('room.created',id,room,200);return reply({room:{id:room,title,mode:permanent?'conversation':b.mode,host:id,permanent:permanent?1:0,canManage:true},id,token,channel:'main'});
  }
  if(b.action==='my_servers'){if(!user)return reply({error:'Entre na sua conta.'},401);const list=await d.prepare('SELECT r.id,r.title FROM rooms r JOIN server_accounts a ON a.room=r.id WHERE a.account=? AND r.permanent=1 ORDER BY r.title').bind(user.userId).all();return reply({rooms:list.results});}
  const room=await d.prepare('SELECT id,title,mode,host,expires,owner,permanent FROM rooms WHERE id=? AND expires>?').bind(clean(b.room,32),now).first<any>();
  if(!room)return reply({error:'Sala encerrada ou link inválido.'},404);
  const publicRoom=()=>{const {owner,...safe}=room;return {...safe,canManage:room.permanent?!!user&&room.owner===user.userId:false}};
  if(b.action==='info')return reply({room:publicRoom()});
  if(b.action==='join'){
   const name=clean(b.name,40);if(!name)return reply({error:'Digite seu nome.'},400);
   const id=uid(),token=uid()+uid();
   const result=await d.prepare('INSERT INTO members (id,room,token,name,seen,account_id) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM members WHERE room=? AND seen>?)<15').bind(id,room.id,token,name,now,user?.userId??null,room.id,now-180000).run();
   if(!result.meta.changes)return reply({error:'A sala está cheia (máximo de 15 pessoas).'},409);
   if(room.permanent&&user&&await d.prepare('SELECT id FROM accounts WHERE id=?').bind(user.userId).first())await d.prepare('INSERT OR IGNORE INTO server_accounts(room,account) VALUES(?,?)').bind(room.id,user.userId).run();
   await audit('room.joined',id,room.id,200);return reply({room:publicRoom(),id,token,channel:'main'});
  }
  const me=await d.prepare('SELECT id,name,seen,suspended,mic,screen,camera,recording,account_id,channel FROM members WHERE id=? AND room=? AND token=?').bind(clean(b.id,32),room.id,clean(b.token,64)).first<any>();
  if(!me)return reply({error:'Sua conexão expirou. Entre na sala novamente.'},401);
  if(me.account_id&&me.account_id!==user?.userId)return reply({error:'Entre novamente pelo convite usando sua conta. Sessão não vinculada a esta conta.'},403);
  if(me.suspended)return reply({error:'Esta sessão foi suspensa pela administração.'},403);
  const manages=room.permanent?!!user&&room.owner===user.userId:me.id===room.host;
  const view=()=>({...publicRoom(),canManage:manages});
  if(b.action==='channel_create'){
   if(!manages)return reply({error:'Somente o responsável pode criar subsalas.'},403);
   const name=clean(b.name,40);if(!name)return reply({error:'Dê um nome à subsala.'},400);await moderateText(name,me.id,room.id);
   const id=uid();const result=await d.prepare('INSERT INTO voice_channels(id,room,name,created) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM voice_channels WHERE room=?)<12').bind(id,room.id,name,now,room.id).run();
   if(!result.meta.changes)return reply({error:'Limite de 12 subsalas atingido.'},409);
   await audit('channel.created',me.id,room.id,200);return reply({ok:true});
  }
  if(b.action==='channel_switch'){
   const channel=clean(b.channel,32);if(channel!=='main'&&!await d.prepare('SELECT id FROM voice_channels WHERE id=? AND room=?').bind(channel,room.id).first())return reply({error:'Subsala inválida.'},404);
   await d.batch([d.prepare('UPDATE members SET channel=?,mic=0,screen=0,camera=0,recording=0,seen=? WHERE id=?').bind(channel,now,me.id),d.prepare('DELETE FROM signals WHERE room=? AND (sender=? OR target=?)').bind(room.id,me.id,me.id)]);
   await audit('channel.switched',me.id,room.id,200);return reply({channel,room:view()});
  }
  if(['poll','signal'].includes(b.action)&&(b.channel??'main')!==me.channel)return reply({error:'Sua subsala mudou. Reconecte à sala.'},409);
  if(b.action==='close'){
   if(!manages)return reply({error:'Somente o responsável pode encerrar a sala.'},403);
   await deleteRoomFiles(room.id);await d.prepare('DELETE FROM rooms WHERE id=?').bind(room.id).run();await audit('room.closed',me.id,room.id,200);return reply({ok:true});
  }
  if(b.action==='chat_list'||b.action==='chat_send'){
   if(me.seen<=now-180000)return reply({error:'Reconecte à sala para usar o chat.'},401);
   if(b.action==='chat_send'){
    const body=typeof b.body==='string'?b.body.trim():'';
    const selectedGif=b.gifUrl==null?null:gifUrl(b.gifUrl);
    if(b.gifUrl!=null&&(!selectedGif||String(b.gifUrl).length>2000))return reply({error:'Selecione um GIF válido no catálogo KLIPY.'},400);
    const clientId=typeof b.clientId==='string'?b.clientId:'';
    if((!body&&!selectedGif)||body.length>2000||!/^[a-f0-9]{32}$/.test(clientId))return reply({error:'Escreva uma mensagem de até 2.000 caracteres.'},400);
    const lookup=()=>d.prepare('SELECT id,sender,name,client_id AS clientId,body,created,attachment_mime AS attachmentMime,attachment_name AS attachmentName,attachment_size AS attachmentSize,gif_url AS gifUrl FROM chat_messages WHERE room=? AND sender=? AND client_id=?').bind(room.id,me.id,clientId).first();
    const existing=await lookup();if(existing)return reply({message:existing});
    if(body)await moderateText(body,me.id,room.id);
    const result=await d.prepare('INSERT INTO chat_messages (room,sender,name,client_id,body,created,gif_url) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM chat_messages WHERE room=? AND sender=? AND created>?) ON CONFLICT(room,sender,client_id) DO NOTHING').bind(room.id,me.id,me.name,clientId,body,now,selectedGif,room.id,me.id,now-1000).run();
    const message=await lookup();if(!message&&!result.meta.changes)return reply({error:'Aguarde um segundo antes de enviar outra mensagem.'},429);
    if(result.meta.changes&&body.startsWith('/')){
     const command=body.split(/\s+/)[0].toLowerCase();
     const answers:Record<string,string>={'/ajuda':'Sou o Sala Bot. Comandos: /ajuda, /regras, /sala, /dado. Não leio áudio nem vídeo.','/regras':'Respeite as pessoas. Não publique conteúdo ilegal, ameaças ou dados pessoais sem consentimento. Denuncie pelo menu do participante.','/sala':`${room.title} · ${room.permanent?'permanente':'temporária'} · até 15 participantes. Use o seletor de calls para trocar de subsala com o mesmo convite.`,'/dado':`${me.name} tirou ${1+(crypto.getRandomValues(new Uint32Array(1))[0]%6)} no dado 🎲`};
     const answer=answers[command]??'Comando desconhecido. Digite /ajuda para ver os comandos do Sala Bot.';
     await d.prepare('INSERT OR IGNORE INTO chat_messages(room,sender,name,client_id,body,created) VALUES(?,?,?,?,?,?)').bind(room.id,'sala-bot','Sala Bot · BOT',clientId,answer,now+1).run();
    }
    await audit('chat.sent',me.id,room.id,200,String(message?.id??''));return reply({message});
   }
   const after=Number.isSafeInteger(b.after)&&b.after>=0?b.after:null;
   const before=Number.isSafeInteger(b.before)&&b.before>0?b.before:null;
   if(after!==null){
    const messages=await d.prepare('SELECT id,sender,name,client_id AS clientId,body,created,attachment_mime AS attachmentMime,attachment_name AS attachmentName,attachment_size AS attachmentSize,gif_url AS gifUrl FROM chat_messages WHERE room=? AND id>? ORDER BY id LIMIT 100').bind(room.id,after).all();
    return reply({messages:messages.results});
   }
   const messages=await d.prepare('SELECT id,sender,name,client_id AS clientId,body,created,attachment_mime AS attachmentMime,attachment_name AS attachmentName,attachment_size AS attachmentSize,gif_url AS gifUrl FROM chat_messages WHERE room=? AND id<? ORDER BY id DESC LIMIT 51').bind(room.id,before??Number.MAX_SAFE_INTEGER).all();
   return reply({messages:messages.results.slice(0,50).reverse(),hasOlder:messages.results.length>50});
  }
  if(b.action==='profile'){
   const name=clean(b.name,40);if(!name||!nameColors.includes(b.color)||!Object.hasOwn(nameFonts,b.font))return reply({error:'Nome ou aparência inválidos.'},400);
   await moderateText(name,me.id,room.id);
   await d.prepare('UPDATE members SET name=?,name_color=?,name_font=? WHERE id=?').bind(name,b.color,b.font,me.id).run();return reply({ok:true});
  }
  if(b.action==='rename'){if(!manages)return reply({error:'Somente o anfitrião pode renomear a sala.'},403);const title=clean(b.title,70);if(!title)return reply({error:'Digite um nome para a sala.'},400);await d.prepare('UPDATE rooms SET title=? WHERE id=?').bind(title,room.id).run();await audit('room.renamed',me.id,room.id,200);return reply({room:{...view(),title}})}
  if(b.action==='resume'){
   const result=await d.prepare('UPDATE members SET seen=?,mic=0,screen=0,camera=0,recording=0 WHERE id=? AND (seen>? OR (SELECT COUNT(*) FROM members WHERE room=? AND seen>?)<15)').bind(now,me.id,now-180000,room.id,now-180000).run();
   if(!result.meta.changes)return reply({error:'A sala está cheia. Tente voltar quando houver uma vaga.'},409);
   await d.batch([
    d.prepare('DELETE FROM signals WHERE room=? AND (target=? OR sender=?)').bind(room.id,me.id,me.id),
    d.prepare('INSERT INTO signals (room,sender,target,payload,created) SELECT ?,?,id,?,? FROM members WHERE room=? AND id<>? AND seen>? AND (?=1 OR id=?)').bind(room.id,me.id,JSON.stringify({type:'reset'}),now,room.id,me.id,now-180000,room.mode==='conversation'||me.id===room.host?1:0,room.host)
   ]);
   await audit('room.resumed',me.id,room.id,200);return reply({room:view(),channel:me.channel});
  }
  if(b.action==='ice')return reply(await iceConfig(me.id));
  if(b.action==='leave'){
   if(me.id===room.host&&!room.permanent){await deleteRoomFiles(room.id);await d.prepare('DELETE FROM rooms WHERE id=?').bind(room.id).run();}
   else await d.prepare('DELETE FROM members WHERE id=?').bind(me.id).run();
   await audit('room.left',me.id,room.id,200);return reply({ok:true});
  }
  if(b.action==='poll'){
   const canSend=room.mode==='conversation'||me.id===room.host;
   const resumed=await d.batch([d.prepare('UPDATE members SET seen=?,mic=?,screen=?,camera=?,recording=? WHERE id=? AND (seen>? OR (SELECT COUNT(*) FROM members WHERE room=? AND seen>?)<15)').bind(now,canSend&&b.mic?1:0,canSend&&b.screen?1:0,canSend&&b.camera?1:0,b.recording===true?1:0,me.id,now-180000,room.id,now-180000),d.prepare('DELETE FROM signals WHERE created<?').bind(now-120000)]);
   if(!resumed[0].meta.changes)return reply({error:'A sala está cheia. Entre novamente quando houver uma vaga.'},409);
   for(const [key,value] of Object.entries({mic:canSend&&b.mic?1:0,screen:canSend&&b.screen?1:0,camera:canSend&&b.camera?1:0,recording:b.recording===true?1:0}))if(me[key]!==value)await audit('media.'+key+(value?'.started':'.stopped'),me.id,room.id,200);
   const [people,messages]=await Promise.all([d.prepare('SELECT id,name,name_color AS nameColor,name_font AS nameFont,mic,screen,camera,recording FROM members WHERE room=? AND channel=? AND seen>? ORDER BY id').bind(room.id,me.channel,now-180000).all(),d.prepare('SELECT id,sender,payload FROM signals WHERE room=? AND target=? AND id>? AND sender IN (SELECT id FROM members WHERE room=? AND channel=?) ORDER BY id LIMIT 100').bind(room.id,me.id,Number.isSafeInteger(b.cursor)&&b.cursor>=0?b.cursor:0,room.id,me.channel).all()]);
   const channels=await d.prepare('SELECT c.id,c.name,(SELECT COUNT(*) FROM members m WHERE m.room=c.room AND m.channel=c.id AND m.seen>?) AS count FROM voice_channels c WHERE c.room=? ORDER BY c.created').bind(now-180000,room.id).all();const main=await d.prepare("SELECT COUNT(*) AS n FROM members WHERE room=? AND channel='main' AND seen>?").bind(room.id,now-180000).first<any>();return reply({room:view(),channel:me.channel,channels:[{id:'main',name:'Geral',count:main?.n??0},...channels.results],members:people.results,signals:messages.results});
  }
  if(b.action==='signal'){
   const target=clean(b.target,32);if(target===me.id)return reply({error:'Destino inválido.'},400);
   if(room.mode==='presentation'&&me.id!==room.host&&target!==room.host)return reply({error:'A plateia se conecta apenas ao apresentador.'},403);
   const peer=await d.prepare('SELECT id FROM members WHERE id=? AND room=? AND channel=? AND seen>?').bind(target,room.id,me.channel,now-180000).first();
   if(!peer)return reply({error:'O participante saiu.'},404);
   const p=b.payload;if(!p||!['offer','answer','candidate','reset','quality'].includes(p.type)|| (!['candidate','reset','quality'].includes(p.type)&&typeof p.sdp!=='string'))return reply({error:'Sinal inválido.'},400);
   if(p.type==='quality'&&!['auto','1080','720'].includes(p.quality))return reply({error:'Qualidade inválida.'},400);
   await d.prepare('INSERT INTO signals (room,sender,target,payload,created) VALUES (?,?,?,?,?)').bind(room.id,me.id,target,JSON.stringify(p.type==='quality'?{type:'quality',quality:p.quality}:p),now).run();
   return reply({ok:true});
  }
  return reply({error:'Ação inválida.'},400);
 }catch(e:any){if(e.status)return reply({error:e.message},e.status);console.error('room-api',e);return reply({error:'Não foi possível acessar a sala. Tente novamente.'},503);}
}
