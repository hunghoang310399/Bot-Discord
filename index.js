import { Client, GatewayIntentBits, Partials, Events, EmbedBuilder, Message } from 'discord.js';
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
    GatewayIntentBits.GuildPresences,// cần để xem online/offline
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,// cần cho đọc nội dung tin nhắn
  ],
 partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
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

/**
 * Đổi nickname cho member với prefix fancy
 */
async function setMemberNickname(member, prefix = '🧍 Người mới |') {
  try {
    const fancyName = `${prefix} ${member.user.username}`;
    await member.setNickname(fancyName, 'Tự động đổi nickname khi join');
    console.log(`✅ Đã đổi nickname của ${member.user.tag} thành "${fancyName}"`);
  } catch (err) {
    console.warn(`⚠️ Không thể đổi nickname cho ${member.user.tag}:`, err.message);
  }
}


/**
 * Xử lý khi member join server
 */
client.on(Events.GuildMemberAdd, async (member) => {
  console.log(`👋 Thành viên mới: ${member.user.tag}`);

  try {
    // 1️⃣ Gửi hướng dẫn bước đầu
    const welcomeChannel = member.guild.channels.cache.get('871059181631864903');
    if (!welcomeChannel) return;

    await setMemberNickname(member, '🧍 Người mới |');
  // Tạo Embed chào mừng với Unicode fancy
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`🀄🐉 𝓒𝓱à𝓸 𝓶ừ𝓷𝓰 <@${member.id}>  đế𝓷 𝓿ớ𝓲 ℌỒ𝔑𝔊 ℌƯ𝔑𝔊 ℌỘℑ! 🐉🀄`)
      .setDescription(
        `Rất vui khi <@${member.id}> gia nhập ℌỒ𝔑𝔊 ℌƯ𝔑𝔊 ℌỘℑ! hãy làm theo hướng dẫn dưới đây để ứng tuyển chính thức.\n`+
        '📝 Vui lòng điền form yêu cầu tham gia tại <#1353746936385110047>\n' +
        '🎤 Sau khi gửi form, sẽ được phỏng vấn qua voice hoặc text.\n\n' +
        '✅ Đậu → Gán role Thành Viên\n' +
        '❌ Rớt → Không vào khu thành viên'
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
      .setImage('https://cdn.discordapp.com/attachments/1366287344679911484/1417546191553560727/image.png')
      .setFooter({ text: 'ℌỒ𝔑𝔊 ℌƯ𝔑𝔊 ℌỘℑ 🀄' })
      .setTimestamp();
    await welcomeChannel.send({ embeds: [embed] });
    console.log(`✅ Đã gửi hướng dẫn cho ${member.displayName}`);
  } catch (err) {
    console.error(err);
  }
});


// Gán role Thành Viên
async function approveMember(member) {
  const role = member.guild.roles.cache.get('1429213724144566303');
  if (!role) return;
  await member.roles.add(role, 'Đậu phỏng vấn');
}

// Kick member
async function rejectMember(member) {
  await member.kick('Rớt phỏng vấn').catch(() => {});
}

// Lắng nghe reaction ở kênh form

// Lắng nghe reaction ở kênh form
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  console.log(`🔔 Reaction thêm bởi ${user.tag} trên tin nhắn ${reaction.message.id}`);
  try {
    if (user.bot) return;

    // fetch nếu partial
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    if (reaction.message.channel.id !== '1353746936385110047') return;

    const reactor = await reaction.message.guild.members.fetch(user.id);

    // const MANAGER_ROLE_ID = 'ROLE_MANAGER_ID';
    // if (!reactor.roles.cache.has(MANAGER_ROLE_ID)) {
    //   await reaction.users.remove(user);
    //   return;
    // }

    const member = await reaction.message.guild.members.fetch(reaction.message.author.id);

    if (reaction.emoji.name === '✅') {
      await approveMember(member);
      await reaction.message.channel.send(`✅ ${member.user.tag} đã được duyệt bởi ${user.tag}`);
    } else if (reaction.emoji.name === '❌') {
      await rejectMember(member);
      await reaction.message.channel.send(`❌ ${member.user.tag} đã rớt bởi ${user.tag}`);
    }

  } catch (err) {
    console.error('Reaction Error:', err);
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
client.login();// ❌ NHỚ đổi sang token mới, token cũ đã lộ
