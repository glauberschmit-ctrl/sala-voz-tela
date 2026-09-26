import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+file,'utf8'));
const store={prepare(query){let args=[];return {bind(...values){args=values;return this},async first(){return sql.prepare(query).get(...args)??null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:Number(r.changes)}}}}},async batch(stmts){return Promise.all(stmts.map(s=>s.run()))}};
const output=ts.transpileModule(fs.readFileSync('app/api/room/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const exports={};new Function('require','exports',output)(name=>{if(name!=='@/db/raw')throw new Error('Unexpected import');return {db:()=>store,iceConfig:async()=>({iceServers:[]})}},exports);
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
