import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
let Processor;vm.runInNewContext(fs.readFileSync('public/noise-gate.js','utf8'),{sampleRate:48000,AudioWorkletProcessor:class{port={}},registerProcessor:(_,ctor)=>Processor=ctor});
const gate=new Processor(),params={threshold:[-50],enabled:[1]};
function block(amplitude,n=128){const input=new Float32Array(n).fill(amplitude),out=new Float32Array(n);gate.process([[input]],[[out]],params);return out}
for(let i=0;i<200;i++)block(.001);
assert.ok(Math.abs(block(.001)[127])<.00005,'quiet noise attenuated >26dB');
for(let i=0;i<10;i++)block(.1);
assert.ok(block(.1)[127]>.099,'voice passes after attack');
assert.ok(block(.001)[127]>.0009,'hold protects word endings');
for(let i=0;i<500;i++)block(.001);
assert.ok(block(.001)[127]<.00005,'gate closes smoothly after hold');
params.enabled=[0];for(let i=0;i<20;i++)block(.001);assert.ok(block(.001)[127]>.00099,'bypass preserves quiet speech');
const silence=[new Float32Array(128).fill(1)];gate.process([], [silence],params);assert.equal(silence[0][0],0);gate.port.onmessage({data:'stop'});assert.equal(gate.process([], [silence],params),false);
console.log('PASS: pause attenuation, speech attack, syllable hold, release, bypass and disposal.');
