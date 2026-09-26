import { env } from 'cloudflare:workers';
import {buildIceConfig} from './ice';
export function db(){if(!env.DB)throw new Error('Serviço de salas indisponível. Tente novamente.');return env.DB;}
export function iceConfig(member:string){return buildIceConfig(env as unknown as Record<string,string|undefined>,member)}
