export type ParticipantPrefs={voice:number;screen:number;muted:boolean;hideCamera:boolean};
export const participantDefaults:ParticipantPrefs={voice:100,screen:100,muted:false,hideCamera:false};
export function normalizeParticipant(value:Partial<ParticipantPrefs>|null|undefined):ParticipantPrefs{
 const p={...participantDefaults};if(!value||typeof value!=='object')return p;
 for(const key of ['voice','screen'] as const)if(typeof value[key]==='number'&&Number.isFinite(value[key]))p[key]=Math.max(0,Math.min(100,value[key]));
 for(const key of ['muted','hideCamera'] as const)if(typeof value[key]==='boolean')p[key]=value[key];return p;
}
export function participantVolume(master:number,p:ParticipantPrefs,kind:'voice'|'screen',active:boolean){return !active||p.muted?0:Math.max(0,Math.min(100,master))*p[kind]/100}
