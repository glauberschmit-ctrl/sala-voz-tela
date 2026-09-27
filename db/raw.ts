import { env } from 'cloudflare:workers';
import {buildIceConfig} from './ice';
export function db(){if(!env.DB)throw new Error('Serviço de salas indisponível. Tente novamente.');return env.DB;}
export function iceConfig(member:string){return buildIceConfig(env as unknown as Record<string,string|undefined>,member)}

export function files(){const bucket=(env as unknown as {FILES?:R2Bucket}).FILES;if(!bucket)throw new Error('Anexos temporariamente indisponíveis.');return bucket;}
export async function deleteRoomFiles(room:string){const bucket=files();let cursor:string|undefined;do{const page=await bucket.list({prefix:room+'/',cursor});if(page.objects.length)await bucket.delete(page.objects.map(o=>o.key));cursor=page.truncated?page.cursor:undefined;}while(cursor)}
