import {requireUser} from '../auth';
import {operationalConfig} from '@/db/operations';
import AdminPanel from './panel';
export const dynamic='force-dynamic';
export default async function Admin(){const user=await requireUser();if(!user.emailVerified||!operationalConfig().admins.includes(user.email.toLowerCase()))return <main className="admin-page"><h1>Administração do Sala</h1><p>Esta conta não está na lista de administradores autorizados. O painel permanece bloqueado até a configuração do responsável.</p><a href="/">Voltar ao Sala</a></main>;return <AdminPanel/>}
