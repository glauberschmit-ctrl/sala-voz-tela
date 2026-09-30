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
