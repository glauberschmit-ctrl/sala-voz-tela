import {env} from 'cloudflare:workers';
import {getUser} from '@/app/auth';
import {db} from '@/db/raw';
import {limited} from '@/db/operations';
import {gifResults,downloadGif} from './provider';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Origem não autorizada.'},403);
  const raw=await req.text();if(raw.length>4096)return reply({error:'Consulta muito longa.'},413);
  const b=JSON.parse(raw);if(!['room','id','token'].every(k=>typeof b[k]==='string'&&b[k].length<=64))return reply({error:'Entre em uma sala.'},401);
  const user=await getUser(),now=Date.now();
  const me=await db().prepare('SELECT m.id FROM members m JOIN rooms r ON r.id=m.room WHERE m.room=? AND m.id=? AND m.token=? AND m.seen>? AND m.suspended=0 AND r.expires>? AND (m.account_id IS NULL OR m.account_id=?)').bind(b.room,b.id,b.token,now-180000,now,user?.userId??null).first();
  if(!me)return reply({error:'Reconecte à sala para buscar GIFs.'},401);
  const key=(env as unknown as Record<string,string|undefined>).KLIPY_API_KEY;
  if(!key)return reply({error:'O catálogo de GIFs aguarda ativação pelo administrador.',configured:false},503);
  if(await limited('gif:'+b.id,20,60))return reply({error:'Aguarde um pouco antes de buscar novamente.'},429);
  if(b.action==='download'){const bytes=await downloadGif(b.url);return new Response(bytes,{headers:{'Content-Type':'image/gif','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
  if(b.action!=='search')return reply({error:'Operação inválida.'},400);
  const q=typeof b.q==='string'?b.q.trim().slice(0,100):'';
  const u=new URL('https://api.klipy.com/v2/'+(q?'search':'featured'));u.searchParams.set('key',key);u.searchParams.set('limit','18');u.searchParams.set('media_filter','tinygif,gif');u.searchParams.set('contentfilter','high');u.searchParams.set('locale','pt_BR');u.searchParams.set('country','BR');if(q)u.searchParams.set('q',q);
  const r=await fetch(u,{signal:AbortSignal.timeout(10000)});if(!r.ok)return reply({error:r.status===429?'O catálogo atingiu o limite de consultas. Tente mais tarde.':'O catálogo está temporariamente indisponível.'},503);
  return reply({items:gifResults(await r.json()),configured:true});
 }catch{return reply({error:'Não foi possível carregar os GIFs. Tente novamente.'},503)}
}
