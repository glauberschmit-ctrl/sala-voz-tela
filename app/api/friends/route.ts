import {getUser} from '@/app/auth';
import {db} from '@/db/raw';
import {audit,limited} from '@/db/operations';
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Origem não autorizada.'},403);
  const user=await getUser(),d=db();
  if(!user||!await d.prepare('SELECT id FROM accounts WHERE id=?').bind(user.userId).first())return reply({error:'Amizades estão disponíveis apenas para contas cadastradas. Entre ou conclua seu cadastro.'},403);
  if(await limited('friends:'+user.userId,60,60))return reply({error:'Aguarde um minuto.'},429);
  const raw=await req.text();if(raw.length>1024)return reply({error:'Pedido muito grande.'},413);const b=JSON.parse(raw);
  if(b.action==='list'){
   await d.prepare('INSERT OR IGNORE INTO friend_codes(account,code) VALUES(?,?)').bind(user.userId,crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase()).run();
   const own=await d.prepare('SELECT code FROM friend_codes WHERE account=?').bind(user.userId).first();
   const rows=await d.prepare('SELECT f.id,f.state,f.requester=? AS outgoing,a.name FROM friendships f JOIN accounts a ON a.id=CASE WHEN f.requester=? THEN f.recipient ELSE f.requester END WHERE f.requester=? OR f.recipient=? ORDER BY f.created DESC').bind(user.userId,user.userId,user.userId,user.userId).all();return reply({code:own?.code,friends:rows.results});
  }
  if(b.action==='request'){
   if(await limited('friend-request:'+user.userId,20,3600))return reply({error:'Limite de pedidos atingido. Tente mais tarde.'},429);
   const code=typeof b.code==='string'?b.code.trim().toUpperCase():'';if(!/^[A-F0-9]{16}$/.test(code))return reply({error:'Informe o código de 16 caracteres do seu amigo.'},400);
   const target=await d.prepare('SELECT account FROM friend_codes WHERE code=?').bind(code).first<{account:string}>();if(!target||target.account===user.userId)return reply({error:'Código não encontrado ou pertence a você.'},400);
   const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([user.userId,target.account].sort())));const id=Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
   await d.prepare('INSERT OR IGNORE INTO friendships(id,requester,recipient,state,created) VALUES(?,?,?,\'pending\',?)').bind(id,user.userId,target.account,Date.now()).run();await audit('friend.requested',user.userId,null,200);return reply({ok:true});
  }
  if(typeof b.id!=='string'||!['accept','remove'].includes(b.action))return reply({error:'Ação inválida.'},400);
  const result=b.action==='accept'?await d.prepare("UPDATE friendships SET state='accepted' WHERE id=? AND recipient=? AND state='pending'").bind(b.id,user.userId).run():await d.prepare('DELETE FROM friendships WHERE id=? AND (requester=? OR recipient=?)').bind(b.id,user.userId,user.userId).run();
  if(!result.meta.changes)return reply({error:'Pedido não encontrado ou sem permissão.'},403);
  await audit('friend.'+b.action,user.userId,null,200);return reply({ok:true});
 }catch{return reply({error:'Não foi possível atualizar suas amizades.'},503)}
}
