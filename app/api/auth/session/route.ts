import {AUTH_COOKIE,getUser} from '@/app/auth';
import {verifyFirebaseToken} from '@/app/firebase-token';
import {db} from '@/db/raw';
import {limited} from '@/db/operations';
const originOK=(r:Request)=>r.headers.get('origin')===new URL(r.url).origin;
function cookie(req:Request,value:string,age:number){return `${AUTH_COOKIE}=${value}; Path=/; HttpOnly; Max-Age=${age}${new URL(req.url).protocol==='https:'?'; SameSite=None; Secure; Partitioned':'; SameSite=Lax'}`}
export async function POST(req:Request){if(!originOK(req))return Response.json({error:'Origem não autorizada.'},{status:403});if(await limited('auth-session:'+(req.headers.get('cf-connecting-ip')??'unknown'),120,60))return Response.json({error:'Aguarde antes de tentar novamente.'},{status:429});const raw=await req.text();if(raw.length>16000)return new Response(null,{status:413});try{const b=JSON.parse(raw);if(typeof b.idToken!=='string')throw new Error('Invalid request');const u=await verifyFirebaseToken(b.idToken);const now=Date.now();await db().prepare('INSERT INTO accounts(id,email,name,created,updated) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email').bind(u.userId,u.email,(u.fullName||u.email.split('@')[0]).slice(0,40),now,now).run();return Response.json({ok:true,userId:u.userId},{headers:{'Cache-Control':'no-store','Set-Cookie':cookie(req,b.idToken,Math.max(0,u.expiresAt-Math.floor(Date.now()/1000)))}})}catch{return Response.json({error:'Não foi possível validar a sessão.'},{status:401,headers:{'Cache-Control':'no-store'}})}}
export async function DELETE(req:Request){if(!originOK(req))return new Response(null,{status:403});return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':cookie(req,'',0)}})}

export async function GET(){const user=await getUser();return Response.json({userId:user?.userId??null},{headers:{'Cache-Control':'no-store'}})}
