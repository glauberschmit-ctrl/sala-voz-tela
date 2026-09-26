// RMS hysteresis keeps short pauses from flickering and rejects very quiet noise.
export function updateVoiceActivity(samples: Float32Array, now: number, lastVoice: number, wasSpeaking: boolean) {
 let energy=0;
 for(const value of samples) energy+=value*value;
 const rms=Math.sqrt(energy/Math.max(1,samples.length));
 const threshold=wasSpeaking?0.009:0.015;
 const last=rms>=threshold?now:lastVoice;
 return {lastVoice:last,speaking:Number.isFinite(last)&&now-last<220};
}
