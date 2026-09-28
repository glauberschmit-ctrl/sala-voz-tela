// MediaStream Recording: https://www.w3.org/TR/mediastream-recording/
export const MAX_RECORDING_BYTES=512*1024*1024;
export const MAX_RECORDING_MS=30*60*1000;
export type RecordingResult={blob:Blob;seconds:number};
export function startScreenRecording(video:MediaStreamTrack,audio:MediaStreamTrack|undefined,onDone:(result:RecordingResult)=>void,onError:(message:string)=>void,onLimit:()=>void){
 if(typeof MediaRecorder==='undefined')throw new Error('Este navegador não oferece gravação de vídeo. Use o aplicativo Windows ou um navegador compatível.');
 if(video.kind!=='video'||video.readyState!=='live'||video.muted)throw new Error('Aguarde a tela começar a chegar antes de gravar.');
 const source=new MediaStream([video.clone(),...(audio?.readyState==='live'?[audio.clone()]:[])]);
 const type=['video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
 let recorder:MediaRecorder;try{recorder=new MediaRecorder(source,{...(type?{mimeType:type}:{}),videoBitsPerSecond:4000000,audioBitsPerSecond:128000})}catch{source.getTracks().forEach(t=>t.stop());throw new Error('Não foi possível iniciar a gravação neste aparelho.')}
 const chunks:Blob[]=[];let bytes=0,stopping=false,disposed=false;const started=Date.now();let timer:ReturnType<typeof setInterval>;
 function release(){clearInterval(timer);video.removeEventListener('ended',stop);source.getTracks().forEach(t=>t.stop())}
 function stop(){if(stopping)return;stopping=true;if(recorder.state!=='inactive')recorder.stop();}
 recorder.ondataavailable=e=>{if(disposed||!e.data.size)return;chunks.push(e.data);bytes+=e.data.size;if(bytes>=MAX_RECORDING_BYTES&&!stopping){onLimit();stop()}};
 recorder.onerror=()=>{if(!disposed)onError('A gravação foi interrompida. Se houver vídeo recuperado, baixe-o abaixo.');stop()};
 recorder.onstop=()=>{release();if(disposed)return;const blob=new Blob(chunks,{type:recorder.mimeType||chunks[0]?.type||'video/webm'});if(blob.size)onDone({blob,seconds:Math.round((Date.now()-started)/1000)});else onError('Nenhum vídeo foi gerado. Aguarde a transmissão e tente novamente.')};
 try{recorder.start(1000)}catch{release();throw new Error('O aparelho recusou o início da gravação.')}
 video.addEventListener('ended',stop);
 timer=setInterval(()=>{if(video.readyState!=='live'||video.muted){stop();return}if(Date.now()-started>=MAX_RECORDING_MS&&!stopping){onLimit();stop()}},1000);
 return {stop,dispose(){disposed=true;stop();release()}};
}
