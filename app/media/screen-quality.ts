export async function preferScreenQuality(track:MediaStreamTrack){
 track.contentHint='detail';
 for(const height of [1080,720]){try{await track.applyConstraints({width:{ideal:height*16/9,max:height*16/9},height:{ideal:height,max:height},frameRate:{ideal:30,max:30}});const actual=track.getSettings();if((actual.height??0)>=height)return actual;}catch{}}
 return track.getSettings();
}
export function screenQualityLabel(track?:MediaStreamTrack){const s=track?.getSettings();return s?.width&&s.height?`${s.width} × ${s.height}`:'Resolução definida pelo aparelho'}
export type ScreenQuality='auto'|'1080'|'720';
export async function setScreenSenderQuality(sender:RTCRtpSender,quality:ScreenQuality,limited=false){
 const track=sender.track;if(!track||track.kind!=='video')return;
 const height=quality==='720'||(quality==='auto'&&limited)?720:1080;
 const sourceHeight=track.getSettings().height??1080,scale=Math.max(1,sourceHeight/height);
 const p=sender.getParameters();if(!p.encodings?.length)return;
 const bitrate=height===720?3000000:6000000;
 if(p.encodings.every(e=>e.scaleResolutionDownBy===scale&&e.maxBitrate===bitrate)&&p.degradationPreference==='maintain-resolution')return;
 p.degradationPreference='maintain-resolution';p.encodings=p.encodings.map(e=>({...e,scaleResolutionDownBy:scale,maxBitrate:bitrate,maxFramerate:30}));await sender.setParameters(p);
}
