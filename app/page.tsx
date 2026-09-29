import {getChatGPTUser} from './chatgpt-auth';
import RoomApp from './room-app';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getChatGPTUser();return <RoomApp key={user?.userId??'guest'} accountId={user?.userId}/>;}
