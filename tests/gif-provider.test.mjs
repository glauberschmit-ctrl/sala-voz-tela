import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const exports={};new Function('exports',ts.transpileModule(fs.readFileSync('app/api/gifs/provider.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)(exports);
const {gifUrl,gifResults,downloadGif,MAX_GIF}=exports;
for(const u of ['http://static.klipy.com/a.gif','https://evil.test/a.gif','https://static.klipy.com.evil.test/a.gif','https://user:pass@static.klipy.com/a.gif','https://static.klipy.com:8443/a.gif','https://static.klipy.com/a.html'])assert.equal(gifUrl(u),null);
const url='https://static.klipy.com/test.gif';assert.equal(gifUrl(url),url);
assert.equal(gifResults({results:[{id:'1',title:'Test',media_formats:{tinygif:{url,size:100}}},{id:'2',media_formats:{gif:{url,size:MAX_GIF+1}}}]}).length,1);
assert.deepEqual(gifResults({error:true}),[]);
const bytes=await downloadGif(url,async(u,opts)=>{assert.equal(opts.redirect,'error');return new Response('GIF89a-test')});assert.equal(new TextDecoder().decode(bytes),'GIF89a-test');
await assert.rejects(()=>downloadGif(url,async()=>new Response('<html>error</html>')));
await assert.rejects(()=>downloadGif(url,async()=>new Response('GIF89a',{headers:{'content-length':String(MAX_GIF+1)}})));
await assert.rejects(()=>downloadGif('https://evil.test/a.gif',async()=>{throw new Error('must not fetch')}));
console.log('PASS: GIF host allowlist, format/size validation, redirect refusal and result normalization.');

for(const host of ['static1.klipy.com','static2.klipy.com'])assert.equal(gifResults({results:[{id:'x',media_formats:{tinygif:{url:`https://${host}/x.gif`}}}]}).length,1);
assert.equal(gifUrl('https://static1.klipy.com.evil.test/a.gif'),null);
