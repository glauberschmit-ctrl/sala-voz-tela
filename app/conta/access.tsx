'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,ShieldCheck,AudioLines,Info} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
export default function Access({signInPath}:{signInPath:string}){
 const [tab,setTab]=useState('login'),[desktop,setDesktop]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setDesktop(/Electron\//.test(navigator.userAgent))},[]);
 function start(){setBusy(true)}
 return <><Tabs value={tab} onValueChange={v=>{setTab(v);setBusy(false)}}><TabsList className="access-tabs"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Criar conta</TabsTrigger></TabsList><TabsContent value="login"><h2>Bom ter você por aqui.</h2><p className="access-subtitle">Entre para acessar seu perfil no Sala.</p></TabsContent><TabsContent value="signup"><h2>Seu lugar na conversa.</h2><p className="access-subtitle">Autentique sua conta e escolha como quer aparecer nas salas.</p></TabsContent></Tabs>
 <button className="provider-button google-pending" type="button" aria-disabled="true" aria-describedby="google-availability" onClick={()=>setMessage('O login direto com Google ainda não está habilitado. Você pode usar ChatGPT ou continuar como convidado.')}><b aria-hidden="true" style={{fontSize:20,width:20,fontFamily:"Arial, sans-serif"}}>G</b><span>{tab==='signup'?'Criar conta com Google':'Continuar com Google'}</span><small>Pendente</small></button><p id="google-availability" className="provider-note">Google ainda não está habilitado.</p>
 {desktop?<div className="access-warning"><Info size={19}/><div><strong>Login pelo navegador</strong><p>O aplicativo Windows atual ainda não conclui o login externo. Copie o endereço e abra no navegador.</p><button type="button" className="secondary" onClick={async()=>{try{await navigator.clipboard.writeText(location.origin+'/conta');setMessage('Endereço copiado. Cole no navegador.')}catch{setMessage('Abra o endereço do Sala no navegador e clique em Entrar (opcional).')}}}>Copiar endereço</button></div></div>:<a className="provider-button chatgpt-provider" href={signInPath} target="_top" onClick={start}><AudioLines size={20}/><span>{busy?'Abrindo autenticação…':tab==='signup'?'Continuar com ChatGPT e criar perfil':'Continuar com ChatGPT'}</span><ArrowUpRight size={18}/></a>}
 <p className="provider-note">Sua autenticação é feita pelo provedor. O Sala não recebe sua senha.</p>
 {tab==='signup'&&<ol className="access-steps"><li><span>1</span>Entre ou crie sua conta no provedor.</li><li><span>2</span>Defina seu nome de exibição no Sala.</li><li><span>3</span>Crie uma sala ou use um convite.</li></ol>}
 <div className="access-divider"><span>ou</span></div><a className="guest-access" href="/">Continuar sem conta <ArrowUpRight size={17}/></a><p className="provider-note">Você pode conversar e compartilhar tela como convidado.</p>
 <details className="access-help"><summary>Preciso de ajuda para entrar</summary><p>Recupere o acesso na página do provedor usado para autenticar. Não envie sua senha ao suporte do Sala.</p><a href="mailto:glauberroberto21@gmail.com">Falar com o suporte</a></details>
 {message&&<p role="status" className="access-message">{message}</p>}<p className="access-security"><ShieldCheck size={15}/> Você controla quando entrar na sua conta.</p></>;
}
