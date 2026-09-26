// Only the offerer creates transceivers. The answerer adopts the offered
// m-lines after setRemoteDescription so its senders are actually negotiated.
export type Channels={mic?:RTCRtpTransceiver;video?:RTCRtpTransceiver;sound?:RTCRtpTransceiver;camera?:RTCRtpTransceiver};
export function prepareChannels(pc:RTCPeerConnection,direction:RTCRtpTransceiverDirection,offerer:boolean):Channels{
 const tracks=offerer?(['audio','video','audio','video'] as const).map(kind=>pc.addTransceiver(kind,{direction})):pc.getTransceivers();
 if(tracks.length!==4)throw new Error('Formato de chamada incompatível. Atualize a página nos dois aparelhos.');
 for(const track of tracks)track.direction=direction;
 return {mic:tracks[0],video:tracks[1],sound:tracks[2],camera:tracks[3]};
}
export async function attachChannels(channels:Channels,tracks:{mic?:MediaStreamTrack|null;video?:MediaStreamTrack|null;sound?:MediaStreamTrack|null;camera?:MediaStreamTrack|null}){
 await Promise.all((Object.keys(tracks) as (keyof Channels)[]).map(key=>channels[key]?.sender.replaceTrack(tracks[key]??null)));
}
