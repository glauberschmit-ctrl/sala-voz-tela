import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {verifyFirebaseToken} from './firebase-token';
export const AUTH_COOKIE='sala_firebase_session_v2';
export async function getUser(){const token=(await cookies()).get(AUTH_COOKIE)?.value;if(!token)return null;try{return await verifyFirebaseToken(token)}catch{return null}}
export async function requireUser(){const user=await getUser();if(user)return user;redirect('/conta')}
