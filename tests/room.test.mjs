import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+file,'utf8'));
const store={prepare(query){let args=[];return {bind(...values){args=values;return this},async first(){return sql.prepare(query).get(...args)??null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:Number(r.changes)}}}}},async batch(stmts){return Promise.all(stmts.map(s=>s.run()))}};
const output=ts.transpileModule(fs.readFileSync('app/api/room/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const exports={};new Function('require','exports',output)(name=>{if(name!=='@/db/raw')throw new Error('Unexpected import');return {db:()=>store,iceConfig:async()=>({iceServers:[]}),deleteRoomFiles:async()=>{}}},exports);
async function request(b,origin='https://test.example'){const r=await exports.POST(new Request('https://test.example/api/room',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(b)}));return {status:r.status,data:await r.json()}}
assert.equal((await request({action:'create',name:'QA',title:'Test',mode:'conversation'},'https://other.example')).status,403);
const c=await request({action:'create',name:'QA Host',title:'QA Apresentação',mode:'presentation'});assert.equal(c.status,200);
const s=c.data,auth={room:s.room.id,id:s.id,token:s.token};
const viewer=(await request({action:'join',room:s.room.id,name:'QA Viewer'})).data,va={room:s.room.id,id:viewer.id,token:viewer.token};
const poll=await request({...va,action:'poll',mic:true,screen:true,camera:true,cursor:0});const actual=poll.data.members.find(x=>x.id===viewer.id);assert.equal(actual.mic,0);assert.equal(actual.screen,0);assert.equal(actual.camera,0);
assert.equal((await request({...auth,token:'invalid',action:'poll'})).status,401);
assert.equal((await request({...auth,token:'invalid',action:'ice'})).status,401);
assert.equal((await request({...auth,action:'ice'})).status,200);
assert.equal((await request({...auth,action:'signal',target:viewer.id,payload:{type:'offer',sdp:'qa-test'}})).status,200);
const delivered=await request({...va,action:'poll',cursor:0});assert.equal(delivered.data.signals.length,1);assert.equal((await request({...va,action:'poll',cursor:delivered.data.signals[0].id})).data.signals.length,0);
const viewer2=(await request({action:'join',room:s.room.id,name:'QA 2'})).data;
assert.equal((await request({...va,action:'signal',target:viewer2.id,payload:{type:'offer',sdp:'not-allowed'}})).status,403);
for(let i=0;i<12;i++)assert.equal((await request({action:'join',room:s.room.id,name:'QA '+i})).status,200);
assert.equal((await request({...auth,action:'poll'})).data.members.length,15);
assert.equal((await request({action:'join',room:s.room.id,name:'QA overflow'})).status,409);
// Backgrounded clients can resume without losing their authenticated identity.
sql.prepare('UPDATE members SET seen=? WHERE id=?').run(Date.now()-240000,viewer.id);
assert.equal((await request({...va,action:'poll'})).status,200);
assert.equal((await request({...auth,action:'signal',target:viewer.id,payload:{type:'reset'}})).status,200);
// A stale member cannot resume into an already full room.
sql.prepare('UPDATE members SET seen=? WHERE id=?').run(Date.now()-240000,viewer.id);
assert.equal((await request({action:'join',room:s.room.id,name:'Replacement'})).status,200);
assert.equal((await request({...va,action:'poll'})).status,409);
assert.equal((await request({...auth,action:'leave'})).status,200);assert.equal((await request({...va,action:'poll'})).status,404);assert.equal(sql.prepare('select count(*) as n from members').get().n,0);assert.equal(sql.prepare('select count(*) as n from signals').get().n,0);
console.log('PASS: creation, invitation, audience permissions, token auth, origin protection, signal delivery and cursor, capacity, room closure and cascade cleanup.');

// Conversation has the same 15-person limit and frees a slot on explicit leave.
const group=(await request({action:'create',name:'Host',title:'15 pessoas',mode:'conversation'})).data;
const ga={room:group.room.id,id:group.id,token:group.token};let last;
for(let i=0;i<14;i++){const result=await request({action:'join',room:group.room.id,name:'Pessoa '+i});assert.equal(result.status,200);last=result.data}
assert.equal((await request({...ga,action:'poll'})).data.members.length,15);
assert.equal((await request({action:'join',room:group.room.id,name:'Pessoa 16'})).status,409);
assert.equal((await request({action:'leave',room:group.room.id,id:last.id,token:last.token})).status,200);
assert.equal((await request({action:'join',room:group.room.id,name:'Vaga reposta'})).status,200);
assert.equal((await request({...ga,action:'poll'})).data.members.length,15);
await request({...ga,action:'leave'});
console.log('PASS: 15 participants in presentation and conversation, 16th rejected, stale resume capacity and slot reuse.');

// Text chat: no microphone required, presentation audience included.
const chatRoom=(await request({action:'create',name:'Chat Host',title:'Chat',mode:'presentation'})).data;
const ca={room:chatRoom.room.id,id:chatRoom.id,token:chatRoom.token};
const guest=(await request({action:'join',room:ca.room,name:'Sem microfone'})).data;
const guestAuth={room:ca.room,id:guest.id,token:guest.token};
const clientId='a'.repeat(32);
assert.equal((await request({...guestAuth,token:'bad',action:'chat_list'})).status,401);
assert.equal((await request({...guestAuth,action:'chat_send',body:'   ',clientId})).status,400);
assert.equal((await request({...guestAuth,action:'chat_send',body:'x'.repeat(2001),clientId})).status,400);
const sent=await request({...guestAuth,action:'chat_send',body:'Olá 👋 <script>alert(1)</script>',clientId,name:'Spoofed'});
assert.equal(sent.status,200);assert.equal(sent.data.message.name,'Sem microfone');
assert.equal((await request({...guestAuth,action:'chat_send',body:'Olá',clientId})).data.message.id,sent.data.message.id);
assert.equal((await request({...guestAuth,action:'chat_send',body:'Rápido demais',clientId:'b'.repeat(32)})).status,429);
assert.equal((await request({...ca,action:'chat_list'})).data.messages.length,1);
assert.equal((await request({...ca,action:'chat_list',after:sent.data.message.id})).data.messages.length,0);
for(let i=0;i<60;i++)sql.prepare('INSERT INTO chat_messages(room,sender,name,client_id,body,created) VALUES(?,?,?,?,?,?)').run(ca.room,ca.id,'Host',String(i).padStart(32,'0'),'Página '+i,Date.now()-5000);
const latest=(await request({...ca,action:'chat_list'})).data;assert.equal(latest.messages.length,50);assert.equal(latest.hasOlder,true);
const older=(await request({...ca,action:'chat_list',before:latest.messages[0].id})).data;assert.equal(older.messages.length,11);assert.equal(older.hasOlder,false);
const other=(await request({action:'create',name:'Outro',title:'Isolada',mode:'conversation'})).data;
assert.equal((await request({room:other.room.id,id:other.id,token:other.token,action:'chat_list'})).data.messages.length,0);
assert.equal((await request({...guestAuth,room:other.room.id,action:'chat_list'})).status,401);
await request({...guestAuth,action:'leave'});assert.equal((await request({...ca,action:'chat_list',before:latest.messages[0].id})).data.messages[0].name,'Sem microfone');
await request({...ca,action:'leave'});assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM chat_messages WHERE room=?').get(ca.room).n,0);
console.log('PASS: chat authentication, room isolation, audience access, idempotency, rate limit, validation, history pagination and cleanup');

// Private image attachments with the same authenticated room session.
const objects=new Map();
const bucket={async put(key,data){objects.set(key,Uint8Array.from(data))},async delete(key){objects.delete(key)},async get(key){const data=objects.get(key);return data?{body:data,size:data.length}:null}};
const format={};new Function('exports',ts.transpileModule(fs.readFileSync('app/api/chat-attachment/image-format.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(format);
const attachmentRoute={};new Function('require','exports',ts.transpileModule(fs.readFileSync('app/api/chat-attachment/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>name==='@/db/raw'?{db:()=>store,files:()=>bucket}:format,attachmentRoute);
const ia={room:other.room.id,id:other.id,token:other.token};
async function upload(auth,bytes,name,client){const form=new FormData();for(const [key,value] of Object.entries({...auth,clientId:client,body:'Legenda'}))form.append(key,value);form.append('file',new Blob([bytes]),name);const response=await attachmentRoute.POST(new Request('https://test.example/api/chat-attachment',{method:'POST',body:form}));return {status:response.status,data:await response.json()}}
const png=fs.readFileSync('public/icon-192.png');
assert.equal((await upload({...ia,token:'bad'},png,'logo.png','c'.repeat(32))).status,401);
assert.equal((await upload(ia,Buffer.from('<svg onload="alert(1)"/>'),'fake.png','c'.repeat(32))).status,400);
const image=await upload(ia,png,'logo.png','c'.repeat(32));assert.equal(image.status,200);assert.equal(image.data.message.attachmentMime,'image/png');assert.equal(objects.size,1);
assert.equal((await upload(ia,png,'logo.png','c'.repeat(32))).data.message.id,image.data.message.id);assert.equal(objects.size,1);
assert.equal((await upload(ia,png,'too-soon.png','d'.repeat(32))).status,429);assert.equal(objects.size,1);
async function download(auth,id){return attachmentRoute.POST(new Request('https://test.example/api/chat-attachment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...auth,action:'download',messageId:id})}))}
const imageDownload=await download(ia,image.data.message.id);assert.equal(imageDownload.status,200);assert.equal(imageDownload.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await imageDownload.arrayBuffer()),png);
assert.equal((await download({...ia,token:'bad'},image.data.message.id)).status,401);
const third=(await request({action:'create',name:'Terceiro',title:'Outra',mode:'conversation'})).data;
assert.equal((await download({room:third.room.id,id:third.id,token:third.token},image.data.message.id)).status,404);
assert.equal(format.imageMime(Buffer.from('GIF89a')), 'image/gif');assert.equal(format.imageMime(Buffer.from('RIFF0000WEBP')),'image/webp');
assert.equal((await upload(ia,new Uint8Array(5*1024*1024+1),'large.png','e'.repeat(32))).status,400);
console.log('PASS: private attachments, signature validation, byte integrity, retry deduplication, rate-limit cleanup, room isolation, GIF/WebP recognition and size limit');
