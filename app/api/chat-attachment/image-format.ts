export const MAX_IMAGE_BYTES=5*1024*1024;
export function imageMime(bytes:Uint8Array){
 const starts=(a:number[])=>a.every((n,i)=>bytes[i]===n);
 if(starts([137,80,78,71,13,10,26,10]))return 'image/png';
 if(starts([255,216,255]))return 'image/jpeg';
 const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
 if(['GIF87a','GIF89a'].includes(ascii(0,6)))return 'image/gif';
 if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')return 'image/webp';
 return null;
}
