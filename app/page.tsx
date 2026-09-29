import {getChatGPTUser,chatGPTSignInPath} from './chatgpt-auth';
import RoomApp from './room-app';
import LoginGate from './login-gate';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getChatGPTUser();return user?<RoomApp key={user.userId} accountId={user.userId}/>:<LoginGate signInPath={chatGPTSignInPath('/')}/>}
