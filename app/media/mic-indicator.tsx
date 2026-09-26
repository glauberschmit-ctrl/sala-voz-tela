'use client';
import {useEffect,useState} from 'react';
import {Mic,MicOff} from 'lucide-react';
import {updateVoiceActivity} from './voice-activity';

let meterContext:AudioContext|null=null;
let users=0;
function acquireContext(){
 if(!meterContext||meterContext.state==='closed')meterContext=new AudioContext();
 users++;
 return meterContext;
}
function releaseContext(context:AudioContext){
 users--;
 if(users===0&&meterContext===context){meterContext=null;void context.close().catch(()=>{});}
}
export default function MicIndicator({stream,enabled,name}:{stream:MediaStream|null;enabled:boolean;name:string}){
 const [speaking,setSpeaking]=useState(false);
 useEffect(()=>{
  setSpeaking(false);
  const track=stream?.getAudioTracks()[0];
  if(!enabled||!stream||!track||track.readyState!=='live')return;
  let context:AudioContext;
  try{context=acquireContext()}catch{return}
  let source:MediaStreamAudioSourceNode|undefined,analyser:AnalyserNode|undefined,silent:GainNode|undefined;
  let timer:ReturnType<typeof setInterval>|undefined;
  let lastVoice=-Infinity,active=false;
  const reset=()=>{lastVoice=-Infinity;active=false;setSpeaking(false)};
  const resume=()=>{if(context.state==='suspended')void context.resume().catch(()=>{})};
  try{
   // Analyze only this microphone. Never replay it through the speakers.
   source=context.createMediaStreamSource(stream);
   analyser=context.createAnalyser();analyser.fftSize=1024;
   silent=context.createGain();silent.gain.value=0;
   source.connect(analyser);analyser.connect(silent);silent.connect(context.destination);
   const samples=new Float32Array(analyser.fftSize);
   timer=setInterval(()=>{
    if(context.state!=='running'||track.readyState!=='live'||track.muted||!track.enabled){if(active)reset();return}
    analyser!.getFloatTimeDomainData(samples);
    const next=updateVoiceActivity(samples,performance.now(),lastVoice,active);
    lastVoice=next.lastVoice;
    if(next.speaking!==active){active=next.speaking;setSpeaking(active)}
   },60);
   resume();
   document.addEventListener('pointerdown',resume);
   document.addEventListener('keydown',resume);
   track.addEventListener('mute',reset);track.addEventListener('ended',reset);
  }catch{reset()}
  return()=>{
   clearInterval(timer);
   document.removeEventListener('pointerdown',resume);document.removeEventListener('keydown',resume);
   track.removeEventListener('mute',reset);track.removeEventListener('ended',reset);
   source?.disconnect();analyser?.disconnect();silent?.disconnect();releaseContext(context);
  };
 },[stream,enabled]);
 const active=enabled&&speaking;
 const label=!enabled?'Microfone desligado':active?'Áudio detectado no microfone':'Microfone ligado, sem áudio detectado';
 return <span className={'mic-indicator '+(!enabled?'is-muted':active?'is-speaking':'is-idle')} role="img" aria-label={`${name}: ${label}`} title={label}>{enabled?<Mic size={16} aria-hidden="true"/>:<MicOff size={16} aria-hidden="true"/>}</span>;
}
