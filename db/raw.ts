import { env } from 'cloudflare:workers';
export function db(){if(!env.DB)throw new Error('Serviço de salas indisponível. Tente novamente.');return env.DB;}
