import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
class Track extends EventTarget{constructor(kind){super();this.kind=kind;this.readyState='live';this.muted=false}clone(){return new Track(this.kind)}stop(){this.readyState='ended'}}
class Stream{constructor(tracks){this.tracks=tracks}getTracks(){return this.tracks}}
let latest;
class Recorder{static isTypeSupported(t){return t==='video/webm'}constructor(stream,options){this.stream=stream;this.mimeType=options.mimeType;this.state='inactive';latest=this}start(){this.state='recording'}stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable({data:new Blob(['final-video-bytes'])});this.onstop()})}}
globalThis.MediaRecorder=Recorder;globalThis.MediaStream=Stream;
const mod={};new Function('exports',ts.transpileModule(fs.readFileSync('app/media/screen-recording.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod);
const video=new Track('video'),audio=new Track('audio');let errors=[],result;
const recording=mod.startScreenRecording(video,audio,r=>result=r,e=>errors.push(e),()=>{});
assert.notEqual(latest.stream.getTracks()[0],video);recording.stop();await new Promise(r=>setImmediate(r));
assert.equal(await result.blob.text(),'final-video-bytes');assert.equal(result.blob.type,'video/webm');assert.equal(video.readyState,'live');assert.equal(audio.readyState,'live');assert.ok(latest.stream.getTracks().every(t=>t.readyState==='ended'));
let disposed=false;const discarded=mod.startScreenRecording(video,undefined,()=>disposed=true,e=>errors.push(e),()=>{});discarded.dispose();await new Promise(r=>setImmediate(r));assert.equal(disposed,false);assert.equal(errors.length,0);
video.stop();assert.throws(()=>mod.startScreenRecording(video,undefined,()=>{},()=>{},()=>{}),/Aguarde/);
console.log('PASS: final recording chunk preserved, cloned tracks cleaned up without stopping the call, disposal and unavailable-screen checks.');
