'use client';
import {useState} from 'react';
import {ShieldCheck,Mail,Info} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
export default function Access({onGuest}:{onGuest?:()=>void}){
 const [tab,setTab]=useState('login');
 return <><Tabs value={tab} onValueChange={setTab}><TabsList className="access-tabs"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Criar conta</TabsTrigger></TabsList><TabsContent value="login"><h2>Bom ter você por aqui.</h2><p className="access-subtitle">Acesse sua conta para manter seu perfil no Sala.</p></TabsContent><TabsContent value="signup"><h2>Crie sua conta no Sala.</h2><p className="access-subtitle">Escolha seu nome e tenha um perfil para suas conversas.</p></TabsContent></Tabs>
 <div className="access-warning" role="status" id="account-unavailable"><Info size={19}/><div><strong>Cadastro e login em preparação</strong><p>Ainda não é possível criar contas ou entrar com Google ou e-mail. Você pode continuar usando as salas sem conta.</p></div></div>
 <button className="provider-button google-pending" type="button" disabled aria-describedby="account-unavailable"><b aria-hidden="true" style={{fontSize:20,width:20,fontFamily:'Arial, sans-serif'}}>G</b><span>Continuar com Google</span></button>
 <div className="access-divider"><span><Mail size={14}/> ou com seu e-mail</span></div>
 <form className="email-access-form" aria-describedby="account-unavailable" onSubmit={e=>e.preventDefault()}>
 <fieldset disabled><legend className="sr-only">{tab==='signup'?'Dados para criar conta':'Dados de acesso'}</legend>
 {tab==='signup'&&<label className="field">Nome de exibição<input type="text" name="displayName" autoComplete="nickname" maxLength={40} placeholder="Como você quer aparecer?" required/><small>É o nome que as outras pessoas verão nas salas.</small></label>}
 <label className="field">E-mail<input type="email" name="email" autoComplete="email" placeholder="voce@exemplo.com" required/></label>
 <label className="field">Senha<input type="password" name="password" autoComplete={tab==='signup'?'new-password':'current-password'} placeholder={tab==='signup'?'Crie uma senha':'Sua senha'} minLength={12} required/>{tab==='signup'&&<small>Use pelo menos 12 caracteres.</small>}</label>
 {tab==='signup'?<><label className="field">Confirmar senha<input type="password" name="confirmPassword" autoComplete="new-password" placeholder="Repita sua senha" required/></label><label className="account-consent"><input type="checkbox" required/><span>Li e aceito os <a href="/termos">termos de uso e privacidade</a>.</span></label></>:<button type="button" className="account-forgot">Esqueci minha senha</button>}
 <button className="primary wide" type="submit">{tab==='signup'?'Criar minha conta':'Entrar'}</button>
 </fieldset></form>
 <div className="access-divider"><span>login é opcional</span></div><a className="guest-access" href="/" onClick={e=>{if(onGuest){e.preventDefault();onGuest()}}}>Continuar sem conta</a>
 <details className="access-help"><summary>Preciso de ajuda</summary><p>Enquanto o cadastro é preparado, crie uma sala ou entre com um convite usando apenas seu nome.</p><a href="mailto:glauberroberto21@gmail.com">Falar com o suporte</a></details>
 <p className="access-security"><ShieldCheck size={15}/> Os campos estão desativados. Nenhuma senha é coletada.</p></>;
}
