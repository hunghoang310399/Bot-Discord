import { Client, GatewayIntentBits } from "discord.js";
import * as play from "play-dl";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import { GoogleGenerativeAI } from "@google/generative-ai";




const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,// cần để xem online/offline
    GatewayIntentBits.GuildMembers, // cần cho đọc nội dung tin nhắn
  ],
});

client.once("clientReady", () => {
  console.log(`✅ Bot đã sẵn sàng: ${client.user.tag}`);
});

// 📌 Auto tạo phòng voice khi join "➕ Tạo Phòng"
client.on("voiceStateUpdate", async (oldState, newState) => {
  if (newState.channel && newState.channel.name === "➕ Tạo Phòng") {
    const guild = newState.guild;

    const newChannel = await guild.channels.create({
      name: `Phòng của ${newState.member.user.globalName || newState.member.user.username}`,
      type: 2, // voice channel
      parent: newState.channel.parent,
    });

    await newState.member.voice.setChannel(newChannel);

    const interval = setInterval(async () => {
      if (newChannel.members.size === 0) {
        await newChannel.delete();
        clearInterval(interval);
      }
    }, 30000);
  }
});

// 📌 Ai đẹp trai nhất
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  if (content.includes("ai đẹp trai nhất")) {
    const targetUser = message.guild.members.cache.find(
      (m) => m.user.username.toLowerCase() === "chautinhkhoa"
    );

    if (targetUser) {
      await message.reply(`😎 Người đẹp trai nhất chắc chắn không phải ông này ${targetUser.user}`);
    } else {
      await message.reply("❌ Không tìm thấy anh đẹp trai (hungku2712) trong server!");
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!online") {
    const guild = message.guild;
    await guild.members.fetch(); // lấy hết member

    // lọc những người đang chơi GTA5VN
    const gtaPlayers = guild.members.cache.filter((m) =>
      m.presence?.activities.some((act) => act.name.toLowerCase() === "gta5vn")
    );

    if (gtaPlayers.size > 0) {
      message.reply(
        `🚗 Có **${gtaPlayers.size}** người đang chơi GTA5VN trong server.`
      );
    } else {
      message.reply("❌ Không ai đang chơi GTA5VN.");
    }
  }
});
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Khi ai gõ: "lên đi xịt sơn"
  if (message.content.toLowerCase().includes("đi xịt sơn nào anh em ơi")) {
    const guild = message.guild;
    await guild.members.fetch();

    // lọc người chơi GTA5VN
    const gtaPlayers = guild.members.cache.filter((m) =>
      m.presence?.activities.some(
        (act) => act.name.toLowerCase() === "gta5vn"
      )
    );

    if (gtaPlayers.size > 0) {
      const mentions = gtaPlayers.map((m) => `<@${m.id}>`).join(" ");
      message.reply(`🚗 Anh em đang onl GTA5VN tập hợp nào!!!\n${mentions}`);
    } else {
      message.reply("❌ Không ai đang chơi GTA5VN.");
    }
  }
});
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Check if message starts with "hỏi bot"
  if (message.content.toLowerCase().includes("bot")) {
    try {
      // Extract the question (remove "hỏi bot" from the start)
      const question = message.content.slice(7).trim();

      // Show typing indicator
      message.channel.sendTyping();
      const genAI = new GoogleGenerativeAI("AIzaSyD6C5hw83Tt9vYPObA8mU5TIoiB-e4uOuI");
      // Get response from Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(question);
      const response = await result.response;
      const text = response.text();

      // Split response if it's too long (Discord has 2000 char limit)
      if (text.length <= 2000) {
        await message.reply(text);
      } else {
        // Split into multiple messages
        const chunks = text.match(/.{1,2000}/g) || [];
        for (const chunk of chunks) {
          await message.channel.send(chunk);
        }
      }

    } catch (error) {
      console.error("Gemini AI Error:", error);
      await message.reply("❌ Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn.");
    }
  }
});

// // Add this new message handler after your existing handlers

// client.on("messageCreate", async (message) => {
//   if (message.author.bot) return;

//   // Check if message is a reply to the bot
//   if (message.reference) {
//     try {
//       const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
//       if (repliedTo.author.id === client.user.id) {
//         // Show typing indicator
//         message.channel.sendTyping();
        
//         // Initialize Gemini
//        const genAI = new GoogleGenerativeAI("AIzaSyD6C5hw83Tt9vYPObA8mU5TIoiB-e4uOuI");
//         const model = genAI.getGenerativeModel({ model: "gemini-pro" });

//         // Create context-aware prompt
//         const prompt = `Bạn là một bot trò chuyện thân thiện. Hãy trả lời tin nhắn sau một cách ngắn gọn và thân thiện: "${message.content}"`;

//         // Generate response
//         const result = await model.generateContent(prompt);
//         const text = result.response.text();

//         // Handle response length
//         if (text.length <= 2000) {
//           await message.reply(text);
//         } else {
//           const chunks = text.match(/.{1,2000}/g) || [];
//           for (const chunk of chunks) {
//             await message.channel.send(chunk);
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Reply Error:", error);
//       await message.reply("❌ Xin lỗi, tôi không thể xử lý phản hồi lúc này.");
//     }
//   }
// });

// ...existing code...
client.login("MTQxODY4MjYwODk0NjEyMjg1Mw.GjRO12.EHBlHYTIt7U8FaFYHS2hH66_5gkZqN-WCC0XYk");// ❌ NHỚ đổi sang token mới, token cũ đã lộ
