// Runs on the audio rendering thread, independent of background tab timers.
class SalaNoiseGate extends AudioWorkletProcessor {
 static get parameterDescriptors(){return [{name:'threshold',defaultValue:-50,minValue:-70,maxValue:-25,automationRate:'k-rate'},{name:'enabled',defaultValue:1,minValue:0,maxValue:1,automationRate:'k-rate'}]}
 constructor(){super();this.level=0;this.hold=0;this.gain=0.04;this.alive=true;this.port.onmessage=e=>{if(e.data==='stop')this.alive=false}}
 process(inputs,outputs,params){const input=inputs[0]??[],output=outputs[0]??[];if(!input.length){output.forEach(c=>c.fill(0));return this.alive}const frames=output[0]?.length??0;const threshold=10**(params.threshold[0]/20);const attack=Math.exp(-1/(sampleRate*.003)),release=Math.exp(-1/(sampleRate*.18));for(let i=0;i<frames;i++){let peak=0;for(const c of input)peak=Math.max(peak,Math.abs(c[i]??0));this.level=Math.max(peak,this.level*.995);if(this.level>=threshold)this.hold=Math.round(sampleRate*.15);else this.hold=Math.max(0,this.hold-1);const target=params.enabled[0]<.5||this.hold>0?1:.04;const smooth=target>this.gain?attack:release;this.gain=target+(this.gain-target)*smooth;for(let c=0;c<output.length;c++)output[c][i]=(input[Math.min(c,input.length-1)]?.[i]??0)*this.gain}return this.alive}
}
registerProcessor('sala-noise-gate',SalaNoiseGate);
