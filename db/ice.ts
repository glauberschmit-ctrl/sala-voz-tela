type IceEnv=Record<string,string|undefined>;
const stun:RTCIceServer[]=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}];
export async function buildIceConfig(values:IceEnv,member:string,request:typeof fetch=fetch){
 if(values.METERED_APP_HOST||values.METERED_TURN_API_KEY){
  const host=values.METERED_APP_HOST??'';
  if(!/^[a-z0-9-]+\.metered\.(live|ca)$/.test(host)||!values.METERED_TURN_API_KEY)throw new Error('Configuração de retransmissão incompleta.');
  const url=new URL(`https://${host}/api/v1/turn/credentials`);
  url.searchParams.set('apiKey',values.METERED_TURN_API_KEY);
  // Never log this URL or provider response: they contain credentials.
  let response:Response;
  try{response=await request(url,{signal:AbortSignal.timeout(8000),cache:'no-store'})}catch{throw new Error('O serviço de retransmissão não respondeu. Tente novamente.')}
  if(!response.ok)throw new Error('O serviço de retransmissão recusou a configuração.');
  let raw:unknown;try{raw=await response.json()}catch{throw new Error('Resposta de retransmissão inválida.')}
  if(!Array.isArray(raw)||raw.length>20)throw new Error('Resposta de retransmissão inválida.');
  const iceServers:RTCIceServer[]=raw.map(entry=>{
   const urls=typeof entry?.urls==='string'?[entry.urls]:entry?.urls;
   if(!Array.isArray(urls)||!urls.length||!urls.every((u:unknown)=>typeof u==='string'&&/^(stun|turn|turns):[^\s]+$/.test(u)))throw new Error('Endereço de retransmissão inválido.');
   const relay=urls.some((u:string)=>/^turns?:/.test(u));
   if(relay&&(typeof entry.username!=='string'||typeof entry.credential!=='string'))throw new Error('Credenciais de retransmissão inválidas.');
   return {urls,...(relay?{username:entry.username,credential:entry.credential}:{})};
  });
  if(!iceServers.some(s=>(s.urls as string[]).some(u=>/^turns?:/.test(u))))throw new Error('O serviço não retornou um servidor de retransmissão.');
  return {iceServers,relayConfigured:true};
 }
 const iceServers=[...stun];
 if(values.TURN_URLS||values.TURN_SHARED_SECRET){
  if(!values.TURN_URLS||!values.TURN_SHARED_SECRET)throw new Error('Configuração de retransmissão incompleta.');
  const urls=values.TURN_URLS.split(',').map(s=>s.trim());
  if(!urls.every(s=>/^turns?:[^\s]+$/.test(s)))throw new Error('TURN_URLS inválido');
  const username=`${Math.floor(Date.now()/1000)+43200}:${member}`;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(values.TURN_SHARED_SECRET),{name:'HMAC',hash:'SHA-1'},false,['sign']);
  const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(username));
  iceServers.push({urls,username,credential:btoa(String.fromCharCode(...new Uint8Array(signature)))});
 }
 return {iceServers,relayConfigured:iceServers.length>stun.length};
}
