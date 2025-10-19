import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  Message,
} from "discord.js";
// Constants for IDs
const CONSTANTS = {
  CHANNELS: {
    WELCOME: "871059181631864903",
    FORM: "1353746936385110047",
    LOG_TV: "1429275713223135263",
    FORM_NOTIFY: "1429292752499380285",
  },
  ROLES: {
    NEW_MEMBER: "1429213724144566303",
    MEMBER: "1429236814782402711",
    MANAGER: "YOUR_MANAGER_ROLE_ID",
    GUES: "1429188588595314899", // Add your manager role ID
  },
  PREFIXES: {
    NEW_MEMBER: "Khách |",
    APPROVED_MEMBER: "TVM |",
    VETERAN: "HHH |",
  },
  TIMING: {
    ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
    CHECK_EMPTY_CHANNEL: 30000,
    DAILY_CHECK: 24 * 60 * 60 * 1000,
  },
  REACTIONS: {
    APPROVE: "✅",
    REJECT: "❌",
  },
  BRANDING: {
    FOOTER_TEXT: "ℌỒ𝔑𝔊 ℌƯ𝔑𝔊 ℌỘℑ 🀄",
    WELCOME_IMAGE:
      "https://cdn.discordapp.com/attachments/1366287344679911484/1417546191553560727/image.png",
  },
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences, // cần để xem online/offline
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions, // cần cho đọc nội dung tin nhắn
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once("clientReady", () => {
  console.log(`✅ Bot đã sẵn sàng: ${client.user.tag}`);
  // Lặp qua mỗi server mà bot ở
  client.guilds.cache.forEach((guild) => {
    // Chạy ngay khi start
    checkAndUpdateNicknames(guild);

    // Sau đó 24h chạy lại 1 lần
    setInterval(() => checkAndUpdateNicknames(guild), 24 * 60 * 60 * 1000);
  });
});

// 📌 Auto tạo phòng voice khi join "➕ Tạo Phòng"
client.on("voiceStateUpdate", async (oldState, newState) => {
  if (newState.channel && newState.channel.name === "➕ Tạo Phòng") {
    const guild = newState.guild;

    const newChannel = await guild.channels.create({
      name: `Phòng của ${newState.member.user.globalName || newState.member.user.username
        }`,
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
  if (message.content.toLowerCase().startsWith("!ungtuyen")) {
    try {
      if (!(message.channel.id === CONSTANTS.CHANNELS.FORM)) {
        return message.reply(
          `⚠️ Vui lòng gửi đơn ứng tuyển trong kênh <#${CONSTANTS.CHANNELS.FORM}>.`
        );
      }
      const args = message.content.slice("!ungtuyen".length).trim();

      if (!args) {
        return message.reply(
          "⚠️ Vui lòng điền đơn theo mẫu:\n" +
          "```!ungtuyen\n" +
          "👤 Họ và tên:\n" +
          "📅 Năm sinh:\n" +
          "🏠 Nơi ở:\n" +
          "🎮 ID game:\n" +
          "📱 SĐT Ingame:\n" +
          "🌐 Chơi server nào:\n" +
          "💭 Lý do muốn vào crew: ```"
        );
      }

      // Tạo embed đơn ứng tuyển
      const applicationEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTitle("📝 Đơn Ứng Tuyển Mới ")
        .setDescription(args)
        .addFields(
          {
            name: "👤 Người nộp",
            value: `<@${message.author.id}>`,
            inline: true,
          },
          {
            name: "⏰ Thời gian",
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true,
          },
          { name: "ID", value: message.id, inline: true }
        )
        .setFooter({ text: CONSTANTS.BRANDING.FOOTER_TEXT })
        .setTimestamp();

      // Gửi đơn vào kênh form
      const formChannel = await client.channels.fetch(
        CONSTANTS.CHANNELS.FORM_NOTIFY
      );
      const sentForm = await formChannel.send({ embeds: [applicationEmbed] });

      // Thêm reaction để duyệt/từ chối
      await sentForm.react(CONSTANTS.REACTIONS.APPROVE);
      await sentForm.react(CONSTANTS.REACTIONS.REJECT);

      // Thông báo đã gửi thành công
      await message.reply(
        "✅ Đã gửi đơn ứng tuyển của bạn! Vui lòng chờ phỏng vấn."
      );
    } catch (error) {
      console.error("Application Error:", error);
      await message.reply(
        "❌ Có lỗi xảy ra khi gửi đơn. Vui lòng thử lại sau!"
      );
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
      m.presence?.activities.some((act) => act.name.toLowerCase() === "gta5vn")
    );

    if (gtaPlayers.size > 0) {
      const mentions = gtaPlayers.map((m) => `<@${m.id}>`).join(" ");
      message.reply(`🚗 Anh em đang onl GTA5VN tập hợp nào!!!\n${mentions}`);
    } else {
      message.reply("❌ Không ai đang chơi GTA5VN.");
    }
  }
});

/**
 * Đổi nickname cho member với prefix fancy
 */
async function setMemberNickname(member, prefix = "🧍 Người mới |") {
  try {
    if (member.user.bot) {
      return;
    }
    const fancyName = `${prefix} ${member.user.username}`;
    await member.setNickname(fancyName, "Tự động đổi nickname khi join");
    console.log(
      `✅ Đã đổi nickname của ${member.user.tag} thành "${fancyName}"`
    );

  } catch (err) {
    console.warn(
      `⚠️ Không thể đổi nickname cho ${member.user.tag}:`,
      err.message
    );
  }
}

/**
 * Xử lý khi member join server
 */
client.on(Events.GuildMemberAdd, async (member) => {
  console.log(`👋 Thành viên mới: ${member.user.tag}`);

  try {
    // 1️⃣ Gửi hướng dẫn bước đầu
    const welcomeChannel = member.guild.channels.cache.get(
      CONSTANTS.CHANNELS.WELCOME
    );
    if (!welcomeChannel) return;

    await setMemberNickname(member, CONSTANTS.PREFIXES.NEW_MEMBER);
    // Tạo Embed chào mừng với Unicode fancy
    const embed = new EmbedBuilder()
      .setColor("#ff09ea")
      .setTitle(`🐉 𝓒𝓱à𝓸 𝓶ừ𝓷𝓰 đế𝓷 𝓿ớ𝓲 ℌỒ𝔑𝔊 ℌƯ𝔑𝔊 ℌỘℑ! 🐉`)
      .setDescription(
        `Rất vui khi <@${member.id}> gia nhập ℌỒ𝔑𝔊 ℌƯ𝔑𝔊 ℌỘℑ! hãy làm theo hướng dẫn dưới đây để ứng tuyển chính thức.\n` +
        `📝 Vui lòng điền form yêu cầu tham gia tại <#${CONSTANTS.CHANNELS.FORM}>\n` +
        "🎤 Sau khi gửi form, sẽ được phỏng vấn qua voice hoặc text.\n\n" +
        "✅ Đậu → Gán role Thành Viên\n" +
        "❌ Rớt → Không vào khu thành viên"
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
      .setImage(
        "https://cdn.discordapp.com/attachments/1366287344679911484/1417546191553560727/image.png"
      )
      .setFooter({ text: "ℌỒ𝔑𝔊 ℌƯ𝔑𝔊 ℌỘℑ 🀄" })
      .setTimestamp();
    await welcomeChannel.send({ embeds: [embed] });
    console.log(`✅ Đã gửi hướng dẫn cho ${member.displayName}`);
  } catch (err) {
    console.error(err);
  }
});

// Gán role Thành Viên


// Kick member
async function rejectMember(member) {
  await member.kick("Rớt phỏng vấn").catch(() => { });
}

// Lắng nghe reaction ở kênh form

// Lắng nghe reaction ở kênh form
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  console.log(
    `🔔 Reaction thêm bởi ${user.tag} trên tin nhắn ${reaction.message.id}`
  );
  try {
    if (user.bot) return;

    // fetch nếu partial
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    if (reaction.message.channel.id !== CONSTANTS.CHANNELS.FORM_NOTIFY) return;

    const reactor = await reaction.message.guild.members.fetch(user.id);

    const MANAGER_ROLE_ID = "870955691014234132";
    if (!reactor.roles.cache.has(MANAGER_ROLE_ID)) {
      await reaction.users.remove(user);
      return;
    }

    const member = await reaction.message.guild.members.fetch(
      reaction.message.author.id
    );

    if (reaction.emoji.name === "✅") {
      const channel = await client.channels.fetch(CONSTANTS.CHANNELS.FORM);
      const args =
        reaction.message.embeds[0]?.fields.find((field) => field.name === "ID")
          ?.value || "Không có ID";
      const originalMessage = await channel.messages
        .fetch(args)
        .catch(() => null);
      await removeRole(originalMessage.member, CONSTANTS.ROLES.GUES);
      await addRole(originalMessage.member, CONSTANTS.ROLES.NEW_MEMBER);
      await setMemberNickname(originalMessage.member, CONSTANTS.PREFIXES.APPROVED_MEMBER);

      const args2 = originalMessage.content.slice("!ungtuyen".length).trim();
      if (originalMessage) {
        await originalMessage.reply(
          `✅ Chúc mừng <@${originalMessage.member.id}> đã trở thành Thành Viên chính thức!`
        );
      }
      reaction.message.delete().catch(() => null);
      const approveEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("✅ Đã Phê Duyệt Thành Viên Vào Crew")
        .setDescription(
          `👤 **Người được duyệt:** ${originalMessage.member.toString()}\n` +
          `🎖️ **Được duyệt bởi:** ${user.toString()}\n` +
          `⏰ **Thời gian duyệt:** <t:${Math.floor(Date.now() / 1000)}:F>\n` +
          `📝 **Form ID:** ${reaction.message.id}\n\n` +
          `📜 **Nội dung form:**\n${args2}`
        )
        .setFooter({ text: CONSTANTS.BRANDING.FOOTER_TEXT })
        .setTimestamp();
      await sendChannelMessage(CONSTANTS.CHANNELS.LOG_TV, approveEmbed);
    } else if (reaction.emoji.name === "❌") {
      await rejectMember(member);
      await reaction.message.reply(
        `❌ <@${member.id}> đã bị từ chối tham gia Thành Viên.`
      );
    }
  } catch (err) {
    console.error("Reaction Error:", err);
  }
});
async function sendChannelMessage(channelId, content) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.error(`❌ Không tìm thấy kênh với ID: ${channelId}`);
      return null;
    }

    const messageOptions =
      content instanceof EmbedBuilder ? { embeds: [content] } : { content };

    const sentMessage = await channel.send(messageOptions);
    console.log(`✅ Đã gửi tin nhắn vào kênh ${channel.name}`);
    return sentMessage;
  } catch (error) {
    console.error(`❌ Lỗi khi gửi tin nhắn:`, error);
    return null;
  }
}

async function addRole(member, roleId) {
  try {
    if (member.user.bot) {
      console.log(`⚠️ Bỏ qua add role: ${member.user.tag} là bot`);
      return;
    }
    const role = member.guild.roles.cache.get(roleId);
    if (!role) {
      console.log(`❌ Không tìm thấy role với ID ${roleId}`);
      return;
    }

    await member.roles.add(role, "Tự động gán role");
    console.log(`✅ Đã gán role ${role.name} cho ${member.user.tag}`);

  } catch (err) {
    console.error(`⚠️ Lỗi khi gán role cho ${member.user.tag}:`, err.message);
  }
}
async function removeRole(member, roleId) {
  try {
    if (member.user.bot) {
      console.log(`⚠️ Bỏ qua remove role: ${member.user.tag} là bot`);
      return;
    }
    const role = member.guild.roles.cache.get(roleId);
    if (!role) {
      console.log(`❌ Không tìm thấy role với ID ${roleId}`);
      return;
    }

    await member.roles.remove(role, "Tự động remove role");
    console.log(`✅ Đã gỡ role ${role.name} khỏi ${member.user.tag}`);
  } catch (err) {
    console.error(
      `⚠️ Lỗi khi remove role cho ${member.user.tag}:`,
      err.message
    );
  }
}
async function checkAndUpdateNicknames(guild) {

  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  await guild.members.fetch(); // đảm bảo load hết member

  // Filter members with the specific role
  const membersWithRole = guild.members.cache.filter(
    (member) => {
      if (member.bot) {
        return;
      }
      member.roles.cache.has(CONSTANTS.ROLES.NEW_MEMBER) && !member.user.bot
    }
  );

  for (const member of membersWithRole.values()) {
    await removeRole(member, CONSTANTS.ROLES.NEW_MEMBER);
    await addRole(member, CONSTANTS.ROLES.MEMBER);
    const joinedAt = member.joinedTimestamp;
    if (!joinedAt) continue;

    if (now - joinedAt >= oneWeek) {
      // Nếu họ vẫn chưa được đổi tên thì đổi
      if (!member.nickname?.includes("Lâu năm")) {
        const newNick = `${CONSTANTS.PREFIXES.VETERAN} ${member.user.username}`;
        try {
          await member.setNickname(newNick, "Tự động đổi biệt danh sau 1 tuần");
          console.log(
            `✅ Đã đổi biệt danh cho ${member.user.tag} thành ${newNick}`
          );
        } catch (err) {
          console.warn(
            `⚠️ Không thể đổi nickname cho ${member.user.tag}:`,
            err.message
          );
        }
      }
    }
  }
}

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
client.login(''); // ❌ NHỚ đổi sang token mới, token cũ đã lộ
