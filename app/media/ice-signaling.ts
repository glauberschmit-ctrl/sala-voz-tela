export type PendingIce={candidate:RTCIceCandidateInit|null;generation?:string};
export type IcePeer={pc:RTCPeerConnection;pending:PendingIce[];generation?:string;iceRejected?:number};
export function matchesGeneration(peer:IcePeer,generation?:string){return !generation||!peer.generation||generation===peer.generation}
export async function receiveIce(peer:IcePeer,candidate:RTCIceCandidateInit|null,generation?:string){
 if(peer.pc.signalingState==='closed'||!matchesGeneration(peer,generation))return;
 if(!peer.pc.remoteDescription){if(peer.pending.length<256)peer.pending.push({candidate,generation});return}
 const ufrag=candidate?.usernameFragment;
 if(ufrag&&!peer.pc.remoteDescription.sdp.split(/\r?\n/).includes('a=ice-ufrag:'+ufrag))return;
 try{await peer.pc.addIceCandidate(candidate??undefined)}catch(e){
  // A rejected candidate must not prevent answering or trying other routes.
  peer.iceRejected=(peer.iceRejected??0)+1;
  if((peer.pc.signalingState as RTCSignalingState)!=='closed'&&(e as {name?:string}).name!=='OperationError')throw e;
 }
}
export async function drainIce(peer:IcePeer){const queued=peer.pending.splice(0);for(const item of queued){try{await receiveIce(peer,item.candidate,item.generation)}catch{/* Already counted; keep draining so the answer can proceed. */}}}
