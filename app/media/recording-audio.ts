export type RecordingAudioSource={track:MediaStreamTrack;gain:number};
// A destination with a stable track lets microphones join/leave without changing MediaRecorder tracks.
export function mixRecordingAudio(getSources:()=>RecordingAudioSource[]){
 const context=new AudioContext(),destination=context.createMediaStreamDestination(),compressor=context.createDynamicsCompressor();compressor.connect(destination);
 const nodes=new Map<MediaStreamTrack,{input:MediaStreamAudioSourceNode;gain:GainNode}>();
 function update(){const sources=getSources().filter(s=>s.track.readyState==='live');const live=new Set(sources.map(s=>s.track));for(const [track,n] of nodes){if(!live.has(track)){n.input.disconnect();n.gain.disconnect();nodes.delete(track)}}for(const source of sources){let n=nodes.get(source.track);if(!n){const input=context.createMediaStreamSource(new MediaStream([source.track])),gain=context.createGain();input.connect(gain);gain.connect(compressor);n={input,gain};nodes.set(source.track,n)}n.gain.gain.value=Math.max(0,Math.min(1,source.gain))}}
 try{update()}catch(e){void context.close();throw e}
 const timer=setInterval(update,250);let closed=false;
 return {track:destination.stream.getAudioTracks()[0],ready:()=>context.resume(),dispose(){if(closed)return;closed=true;clearInterval(timer);nodes.forEach(n=>{n.input.disconnect();n.gain.disconnect()});compressor.disconnect();destination.stream.getTracks().forEach(t=>t.stop());void context.close()}};
}
