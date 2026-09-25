import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Sala — Voz e tela',description:'Converse e compartilhe sua tela em uma sala.',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},appleWebApp:{capable:true,title:'Sala',statusBarStyle:'black-translucent'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}
