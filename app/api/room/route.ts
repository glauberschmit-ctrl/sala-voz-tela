import { db,iceConfig } from '@/db/raw';
const reply=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
const uid=()=>crypto.randomUUID().replaceAll('-','');
const clean=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n):'';
export async function POST(req:Request){
 try{
  const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return reply({error:'Origem não autorizada.'},403);
  const raw=await req.text();if(raw.length>70000)return reply({error:'Pedido muito grande.'},413);
  const b=JSON.parse(raw),d=db(),now=Date.now();
  if(b.action==='create'){
   const name=clean(b.name,40),title=clean(b.title,70);if(!name||!title||!['conversation','presentation'].includes(b.mode))return reply({error:'Preencha seu nome, o título e o modo da sala.'},400);
   const room=uid(),id=uid(),token=uid()+uid();
   await d.batch([d.prepare('DELETE FROM rooms WHERE expires < ?').bind(now),d.prepare('INSERT INTO rooms (id,title,mode,host,expires) VALUES (?,?,?,?,?)').bind(room,title,b.mode,id,now+43200000),d.prepare('INSERT INTO members (id,room,token,name,seen) VALUES (?,?,?,?,?)').bind(id,room,token,name,now)]);
   return reply({room:{id:room,title,mode:b.mode,host:id},id,token});
  }
  const room=await d.prepare('SELECT id,title,mode,host,expires FROM rooms WHERE id=? AND expires>?').bind(clean(b.room,32),now).first<any>();
  if(!room)return reply({error:'Sala encerrada ou link inválido.'},404);
  if(b.action==='info')return reply({room});
  if(b.action==='join'){
   const name=clean(b.name,40);if(!name)return reply({error:'Digite seu nome.'},400);
   const id=uid(),token=uid()+uid();
   const result=await d.prepare('INSERT INTO members (id,room,token,name,seen) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM members WHERE room=? AND seen>?)<15').bind(id,room.id,token,name,now,room.id,now-180000).run();
   if(!result.meta.changes)return reply({error:'A sala está cheia (máximo de 15 pessoas).'},409);
   return reply({room,id,token});
  }
  const me=await d.prepare('SELECT id,name,seen FROM members WHERE id=? AND room=? AND token=?').bind(clean(b.id,32),room.id,clean(b.token,64)).first<any>();
  if(!me)return reply({error:'Sua conexão expirou. Entre na sala novamente.'},401);
  if(b.action==='ice')return reply(await iceConfig(me.id));
  if(b.action==='leave'){
   if(me.id===room.host)await d.prepare('DELETE FROM rooms WHERE id=?').bind(room.id).run();
   else await d.prepare('DELETE FROM members WHERE id=?').bind(me.id).run();
   return reply({ok:true});
  }
  if(b.action==='poll'){
   const canSend=room.mode==='conversation'||me.id===room.host;
   const resumed=await d.batch([d.prepare('UPDATE members SET seen=?,mic=?,screen=?,camera=? WHERE id=? AND (seen>? OR (SELECT COUNT(*) FROM members WHERE room=? AND seen>?)<15)').bind(now,canSend&&b.mic?1:0,canSend&&b.screen?1:0,canSend&&b.camera?1:0,me.id,now-180000,room.id,now-180000),d.prepare('DELETE FROM signals WHERE created<?').bind(now-120000)]);
   if(!resumed[0].meta.changes)return reply({error:'A sala está cheia. Entre novamente quando houver uma vaga.'},409);
   const [people,messages]=await Promise.all([d.prepare('SELECT id,name,mic,screen,camera FROM members WHERE room=? AND seen>? ORDER BY id').bind(room.id,now-180000).all(),d.prepare('SELECT id,sender,payload FROM signals WHERE room=? AND target=? AND id>? ORDER BY id LIMIT 100').bind(room.id,me.id,Number.isSafeInteger(b.cursor)&&b.cursor>=0?b.cursor:0).all()]);
   return reply({members:people.results,signals:messages.results});
  }
  if(b.action==='signal'){
   const target=clean(b.target,32);if(target===me.id)return reply({error:'Destino inválido.'},400);
   if(room.mode==='presentation'&&me.id!==room.host&&target!==room.host)return reply({error:'A plateia se conecta apenas ao apresentador.'},403);
   const peer=await d.prepare('SELECT id FROM members WHERE id=? AND room=? AND seen>?').bind(target,room.id,now-180000).first();
   if(!peer)return reply({error:'O participante saiu.'},404);
   const p=b.payload;if(!p||!['offer','answer','candidate','reset'].includes(p.type)|| (!['candidate','reset'].includes(p.type)&&typeof p.sdp!=='string'))return reply({error:'Sinal inválido.'},400);
   await d.prepare('INSERT INTO signals (room,sender,target,payload,created) VALUES (?,?,?,?,?)').bind(room.id,me.id,target,JSON.stringify(p),now).run();
   return reply({ok:true});
  }
  return reply({error:'Ação inválida.'},400);
 }catch(e){console.error('room-api',e);return reply({error:'Não foi possível acessar a sala. Tente novamente.'},503);}
}
