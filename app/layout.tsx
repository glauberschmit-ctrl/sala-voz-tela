import type { Metadata } from 'next';
import './globals.css';
import AuthSession from './auth-session';
import {getUser} from './auth';
export const metadata:Metadata={title:'Sala — Voz e tela',description:'Converse e compartilhe sua tela em uma sala.',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},appleWebApp:{capable:true,title:'Sala',statusBarStyle:'black-translucent'}};
export default async function RootLayout({children}:Readonly<{children:React.ReactNode}>){const user=await getUser();return <html lang="pt-BR"><body><AuthSession serverUserId={user?.userId}/>{children}</body></html>}
