import {getUser} from '@/app/auth';
import {db} from '@/db/raw';
import {audit,limited} from '@/db/operations';
const reply=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const user=await getUser();if(!user)return reply({error:'Entre para acessar sua conta.'},401);const account=await db().prepare('SELECT name,created,updated FROM accounts WHERE id=?').bind(user.userId).first();return reply({account:account??null,email:user.email})}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Origem não autorizada.'},403);
 const user=await getUser();if(!user)return reply({error:'Entre para acessar sua conta.'},401);
 if(await limited('account:'+user.userId,20,60))return reply({error:'Aguarde um minuto antes de tentar novamente.'},429);
 const raw=await req.text();if(raw.length>2048)return reply({error:'Pedido muito grande.'},413);
 let b:any;try{b=JSON.parse(raw)}catch{return reply({error:'Pedido inválido.'},400)}
 if(b.action==='delete'){await db().prepare('DELETE FROM accounts WHERE id=?').bind(user.userId).run();await audit('account.deleted',user.userId,null,200);return reply({ok:true})}
 if(b.action!=='save'||typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>40||/[\x00-\x1f\x7f]/.test(b.name))return reply({error:'Informe um nome de 1 a 40 caracteres.'},400);
 const now=Date.now();await db().prepare('INSERT INTO accounts(id,email,name,created,updated) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,updated=excluded.updated').bind(user.userId,user.email,b.name.trim(),now,now).run();await audit('account.saved',user.userId,null,200);return reply({ok:true,name:b.name.trim()});
}
