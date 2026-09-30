export const nameColors=['#e8edf5','#a3e635','#7dd3fc','#f9a8d4','#fcd34d','#c4b5fd'] as const;
export const nameFonts={sans:'Arial, sans-serif',rounded:'Trebuchet MS, sans-serif',serif:'Georgia, serif',mono:'Courier New, monospace'};
export function nameStyle(color?:string,font?:string){return {color:nameColors.includes(color as any)?color:nameColors[0],fontFamily:nameFonts[font as keyof typeof nameFonts]??nameFonts.sans}}
