import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import ts from 'typescript';import * as jose from 'jose';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sala-auth-'));
try{
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',dir+'/key.pem','-out',dir+'/cert.pem','-days','1','-subj','/CN=auth-test'],{stdio:'ignore'});
 const key=await jose.importPKCS8(fs.readFileSync(dir+'/key.pem','utf8'),'RS256'),cert=fs.readFileSync(dir+'/cert.pem','utf8');
 const mod={};new Function('require','exports',ts.transpileModule(fs.readFileSync('app/firebase-token.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>n==='jose'?jose:{firebaseConfig:{projectId:'sala-2f9c7'}},mod);
 const originalFetch=globalThis.fetch;let fetches=0;globalThis.fetch=async()=>{fetches++;return Response.json({test:cert},{headers:{'cache-control':'max-age=3600'}})};
 const now=Math.floor(Date.now()/1000);const base={sub:'one',email:'one@example.test',email_verified:true,auth_time:now-10,iat:now,exp:now+600,aud:'sala-2f9c7',iss:'https://securetoken.google.com/sala-2f9c7'};
 const sign=(patch={},kid='test')=>new jose.SignJWT({...base,...patch}).setProtectedHeader({alg:'RS256',kid}).sign(key);
 try{const good=await sign();assert.equal((await mod.verifyFirebaseToken(good)).userId,'firebase:one');assert.equal((await mod.verifyFirebaseToken(await sign({email_verified:false}))).emailVerified,false);for(const patch of [{aud:'wrong-project'},{iss:'https://attacker.invalid'},{exp:now-5},{iat:now+600},{auth_time:now+600},{sub:''},{email:null}]){const bad=await sign(patch);await assert.rejects(()=>mod.verifyFirebaseToken(bad))};}finally{globalThis.fetch=originalFetch}
 // Verify malformed/forged tokens fail even without a certificate request.
 await assert.rejects(()=>mod.verifyFirebaseToken('not-a-token'));
 assert.equal(fetches,1);
 console.log('PASS: Firebase signature verification, project/issuer binding, expiry, identity claims, email verification and certificate cache.');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
