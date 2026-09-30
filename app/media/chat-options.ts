export const chatFonts:Record<string,{label:string;family:string}>={
 system:{label:'Padrão do aparelho',family:'system-ui, sans-serif'},
 sans:{label:'Arial',family:'Arial, Helvetica, sans-serif'},
 verdana:{label:'Verdana',family:'Verdana, Geneva, sans-serif'},
 tahoma:{label:'Tahoma',family:'Tahoma, Arial, sans-serif'},
 trebuchet:{label:'Trebuchet',family:'"Trebuchet MS", Arial, sans-serif'},
 serif:{label:'Georgia',family:'Georgia, "Times New Roman", serif'},
 times:{label:'Times',family:'"Times New Roman", Times, serif'},
 palatino:{label:'Palatino',family:'Palatino, "Palatino Linotype", Georgia, serif'},
 mono:{label:'Consolas',family:'Consolas, "Liberation Mono", monospace'},
 courier:{label:'Courier',family:'"Courier New", Courier, monospace'},
 rounded:{label:'Arredondada',family:'ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif'},
 casual:{label:'Descontraída',family:'"Comic Sans MS", "Chalkboard SE", cursive'}
};
export const emojiGroups=[
 {name:'Carinhas',icon:'😀',items:'😀 😃 😄 😁 😆 😅 😂 🤣 😊 🙂 🙃 😉 😍 🥰 😘 😎 🤓 🥳 🤔 🫡 🤗 🤭 🫢 😴 🥱 😮 😱 😭 😢 😤 😡 🤯 🥹 🫠'.split(' ')},
 {name:'Gestos',icon:'👋',items:'👋 🤚 ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤝 🙏 💪 🫶 ✍️'.split(' ')},
 {name:'Jogos',icon:'🎮',items:'🎮 🕹️ 🎯 🏆 🥇 🥈 🥉 🎲 ♟️ 🧩 🃏 ⚽ 🏀 🏁 🚀 🛸 ⚔️ 🛡️ 💎 👑 🔥 ⚡ 💥 💯 ✅ ❌ 👀 💤'.split(' ')},
 {name:'Corações',icon:'💚',items:'❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 🩷 🩵 🩶 💔 ❤️‍🔥 ❤️‍🩹 💕 💞 💓 💗 💖 💘 💝 💟 ✨ 🌟 ⭐ 🌈 ☀️ 🌙 🎉 🎊 🎈 🎁'.split(' ')},
 {name:'Bichos e comida',icon:'🐱',items:'🐱 🐶 🦊 🐻 🐼 🐨 🐯 🦁 🐸 🐵 🐧 🦆 🦉 🦋 🐢 🐙 🦈 🐉 🌻 🌵 🍀 🍕 🍔 🍟 🌭 🍿 🍩 🍪 🎂 🍫 ☕ 🧃 🥤 🍉 🍓'.split(' ')}
];
export function chatPollDelay(visible:boolean,active:boolean,open:boolean,failures:number,fullPage=false){
 if(failures)return Math.min(15000,1500*2**Math.min(failures-1,4));
 if(visible&&active&&open)return fullPage?100:800;
 return visible?3000:6000;
}
