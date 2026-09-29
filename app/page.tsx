import {getUser} from './auth';
import RoomApp from './room-app';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getUser();return <RoomApp key={user?.userId??'guest'} accountId={user?.userId}/>;}
