const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'setupticket',
  description: 'Setup the ticket system',

  async execute(message, client) {
    const embed = new EmbedBuilder()
      .setTitle(':tickets: Ticket System Setup for CNR - Discord AI Hub |  CNR - Discord AI Hubإعداد نظام التذاكر لـ :tickets:')
      .setDescription(`
**Welcome to the CNR - Discord AI Hub ticketing system!**
**CNR - Discord AI Hub! مرحبًا بك في نظام التذاكر**

This feature is designed to streamline your interactions and support requests. By selecting a category from the dropdown menu, you can easily communicate your needs, whether it's applying for a role, seeking support, or submitting suggestions.
**تم تصميم هذه الميزة لتبسيط تفاعلاتك وطلبات الدعم. من خلال تحديد فئة من القائمة المنسدلة، يمكنك بسهولة توصيل احتياجاتك، سواء كان ذلك التقدم لوظيفة أو طلب الدعم أو تقديم الاقتراحات.**

**How It Works:** | **:كيف يعمل**

> **Select a Category:** Choose from various options such as Moderator Application, <@&1248949429713764353> Application, <@&1248697926515953694> Application, Support, Suggestions, Bug Reports, User Reports, or Other Inquiries.  
> **حدد فئة:** اختر من بين خيارات مختلفة مثل طلب الحصول على مشرف أو طلب الحصول على <@&1248949429713764353> أو طلب الحصول على <@&1248697926515953694> أو الدعم أو الاقتراحات أو تقارير الأخطاء أو تقارير المستخدم أو الاستفسارات الأخرى.

> **Receive Assistance:** Once your ticket is created, a dedicated staff member will review your request and respond promptly.  
> **تلقي المساعدة:** بمجرد إنشاء تذكرتك، سيراجع أحد أعضاء المشرفين المخصص طلبك ويرد عليه على الفور.

> **Feedback Welcome:** Your feedback helps us improve our services and enhance your experience in the community.  
> **نرحب بالملاحظات:** تساعدنا ملاحظاتك في تحسين خدماتنا وتعزيز تجربتك في المجتمع.

We appreciate your participation in making the community a better place for everyone!  
**نشكرك على مشاركتك في جعل المجتمع مكانًا أفضل للجميع!**

**Please select a category to create a ticket:** | **:يرجى تحديد فئة لإنشاء تذكرة**`)
      .setColor('Aqua')
      .setFooter({ text: 'CNR - Discord AI Hub | Select a Category' })
      .setThumbnail('https://example.com/your-thumbnail.jpg'); // Replace with your thumbnail URL

      const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_category')
      .setPlaceholder('Select a category...')
      .addOptions([
        {
          label: 'Request for Moderation',
          value: 'moderator_application',
          description: 'Apply for staff Moderator.',
        },
        {
          label: 'Request to Join the FBI Team',
          value: 'fbi_application',
          description: 'Apply for FBI.',
        },
        {
          label: 'Request to Join the Hitman Team',
          value: 'hitman_application',
          description: 'Apply for Hitman.',
        },
        {
          label: 'Request for Assistance',
          value: 'support',
          description: 'Get help with technical issues.',
        },
        {
          label: 'Suggestions for the Community',
          value: 'suggestions',
          description: 'Submit your suggestions for improvement.',
        },
        {
          label: 'Report a bug in the game',
          value: 'bug_reports',
          description: 'Report any bugs you encounter.',
        },
        {
          label: 'Report a User',
          value: 'user_reports',
          description: 'Report concerns about other users.',
        },
        {
          label: 'Other Inquiries',
          value: 'other_inquiries',
          description: 'For any other inquiries you may have.',
        },
      ])
      .addOptions([
        {
          label: 'طلب الإشراف',
          value: 'moderator_application_ar',
          description: 'طلب الحصول على مشرف.',
        },
        {
          label: 'طلب التقديم لفرقة FBI',
          value: 'fbi_application_ar',
          description: 'طلب الانضمام إلى FBI.',
        },
        {
          label: 'طلب التقديم لفريق القتلة',
          value: 'hitman_application_ar',
          description: 'طلب الانضمام إلى Hitman.',
        },
        {
          label: 'طلب المساعدة',
          value: 'support_ar',
          description: 'الحصول على مساعدة بشأن المشكلات التقنية.',
        },
        {
          label: 'اقتراحات للمجتمع',
          value: 'suggestions_ar',
          description: 'تقديم اقتراحاتك للتحسين.',
        },
        {
          label: 'الإبلاغ عن خطأ في اللعبة',
          value: 'bug_reports_ar',
          description: 'الإبلاغ عن أي أخطاء تواجهها.',
        },
        {
          label: 'إبلاغ عن مستخدم',
          value: 'user_reports_ar',
          description: 'الإبلاغ عن مخاوف بشأن مستخدمين آخرين.',
        },
        {
          label: 'استفسارات اخرى',
          value: 'other_inquiries_ar',
          description: 'لأي استفسارات أخرى قد تكون لديك.',
        },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const setupMessage = await message.channel.send({ embeds: [embed], components: [row] });

    const setupData = {
      messageId: setupMessage.id,
      channelId: setupMessage.channel.id,
      guildId: message.guild.id,
    };
    
    const setupFilePath = path.join(__dirname, '..', 'ticketSetup.json');
    fs.writeFileSync(setupFilePath, JSON.stringify(setupData));

    this.createCollector(client, setupMessage);
  },

  createCollector(client, setupMessage) {
    const filter = (interaction) => interaction.isStringSelectMenu() && interaction.customId === 'ticket_category';
    const collector = setupMessage.createMessageComponentCollector({ filter });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();
      const ticketCategory = interaction.values[0];
      const categoryId = '1247241367449768117'; // Your specific category ID
      const category = interaction.guild.channels.cache.get(categoryId);

      if (!category) {
        console.error(`Category with ID ${categoryId} not found.`);
        return;
      }

      const channel = await interaction.guild.channels.create({
        name: `${ticketCategory}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: categoryId,
        topic: `Ticket for **${ticketCategory}** by <@${interaction.user.id}>. Please provide your details below:`,
      });

      await this.sendTicketForm(interaction, channel, ticketCategory);

      const logChannelId = '1288960296697987193'; // Your log channel ID
      const logChannel = interaction.guild.channels.cache.get(logChannelId);

      if (logChannel) {
        await logChannel.send(`A new ticket has been created: **${ticketCategory}** by <@${interaction.user.id}> in channel ${channel}.`);
      } else {
        console.error(`Log channel with ID ${logChannelId} not found.`);
      }

      await interaction.followUp({ content: `Your ticket channel has been created: ${channel}`, ephemeral: true });
    });
  },

  async sendTicketForm(interaction, channel, ticketCategory) {
    const formEmbed = new EmbedBuilder()
      .setTitle(`📝 ${ticketCategory} Form`)
      .setDescription('Please fill out the following questions:')
      .setColor('Green');

    let questions;

    switch (ticketCategory) {
      case 'moderator_application':
        questions = [
          'Account Name:',
          'CNR Level:',
          'What Languages do you know?',
          'Why do you want to be a moderator? [Motivation]:',
        ];
        break;
      case 'moderator_application_ar':
        questions = [
          'اسم حسابك:',
          'مستوى CNR الخاص بك:',
          'ما هي اللغات التي تعرفها؟',
          'لماذا تريد أن تكون مشرفًا؟',
        ];
        break;
      case 'fbi_application':
        questions = [
          'Account Name:',
          'CNR Level:',
          'Why do you want to be FBI?',
        ];
        break;
      case 'fbi_application_ar':
        questions = [
          'اسم حسابك:',
          'مستوى CNR الخاص بك:',
          'لماذا تريد أن تصبح FBI؟',
        ];
        break;
      case 'hitman_application':
        questions = [
          'Account Name:',
          'CNR Level:',
          'Why do you want to be Hitman?',
        ];
        break;
      case 'hitman_application_ar':
        questions = [
          'اسم حسابك:',
          'مستوى CNR الخاص بك:',
          'لماذا تريد أن تصبح Hitman؟',
        ];
        break;
      case 'support':
        questions = [
          'Account Name:',
          'How can we help you?',
        ];
        break;
      case 'support_ar':
        questions = [
          'اسم حسابك:',
          'كيف يمكننا مساعدتك؟',
        ];
        break;
      case 'suggestions':
        questions = [
          'Account Name:',
          'Your suggestions:',
        ];
        break;
      case 'suggestions_ar':
        questions = [
          'اسم حسابك:',
          'اقتراحاتك:',
        ];
        break;
      case 'bug_reports':
        questions = [
          'Account Name:',
          'What bug did you encounter?',
        ];
        break;
      case 'bug_reports_ar':
        questions = [
          'اسم حسابك:',
          'ما هي الأخطاء التي واجهتها؟',
        ];
        break;
      case 'user_reports':
        questions = [
          'Account Name:',
          'Who are you reporting?',
          'Why are you reporting them?',
        ];
        break;
      case 'user_reports_ar':
        questions = [
          'اسم حسابك:',
          'من تقوم بالإبلاغ عنه؟',
          'لماذا تقوم بالإبلاغ عنه؟',
        ];
        break;
      case 'other_inquiries':
        questions = [
          'Account Name:',
          'Please describe your inquiry:',
        ];
        break;
      case 'other_inquiries_ar':
        questions = [
          'اسم حسابك:',
          'يرجى وصف استفسارك:',
        ];
        break;
      default:
        questions = [];
    }

    await channel.send({ embeds: [formEmbed] });

    for (const question of questions) {
      await channel.send(question);
    }
  


    const questionFields = questions.map((question, index) => {
      return `${index + 1}. ${question}`;
    }).join('\n');

    await channel.send({ embeds: [formEmbed.setDescription(questionFields)] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = channel.createMessageCollector({ filter, time: 300000 }); // 5 minutes to fill out the form

    const responses = [];

    collector.on('collect', async m => {
      responses.push(m.content);
      await m.delete(); // Delete the user's response for a cleaner channel

      if (responses.length === questions.length) {
        collector.stop(); // Stop collecting once all questions have been answered
      }
    });

    collector.on('end', async () => {
      if (responses.length === questions.length) {
        const responseEmbed = new EmbedBuilder()
          .setTitle(`📄 Ticket Submission for ${ticketCategory}`)
          .setDescription(responses.map((response, index) => `${questions[index]} ${response}`).join('\n'))
          .setColor('Blue')
          .setTimestamp();

        await channel.send({ embeds: [responseEmbed] });

        const closeButton = new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger);

        const closeRow = new ActionRowBuilder().addComponents(closeButton);

        await channel.send({ content: 'Please review your ticket submission.', components: [closeRow] });
      } else {
        await channel.send('You did not complete the form in time.');
      }
    });
  },

  async handleCloseTicket(interaction) {
    const closeRoleId = '1247226799276949536'; // Role ID allowed to close tickets

    if (interaction.customId === 'close_ticket') {
      if (interaction.member.roles.cache.has(closeRoleId)) {
        const ticketChannel = interaction.channel;
        const ticketCreator = ticketChannel.topic.match(/<@(\d+)>/)?.[1];

        // Disable view channel and send messages permissions
        await ticketChannel.permissionOverwrites.edit(ticketCreator, {
          ViewChannel: false,
          SendMessages: false,
        });

        // Move the channel to a closed tickets category
        const closedCategoryId = '1234567890123456789'; // Replace with your closed tickets category ID
        await ticketChannel.setParent(closedCategoryId, { lockPermissions: false });

        // Archive the ticket content
        const messages = await ticketChannel.messages.fetch({ limit: 100 });
        const ticketContent = messages.reverse().map(m => `${m.author.tag}: ${m.content}`).join('\n');

        // Create and send transcript
        const transcript = new EmbedBuilder()
          .setTitle(`Transcript for ${ticketChannel.name}`)
          .setDescription(ticketContent.substring(0, 4000)) // Discord embed character limit
          .setColor('Gray')
          .setTimestamp();

        const transcriptChannel = interaction.guild.channels.cache.get('transcript_channel_id'); // Replace with your transcript channel ID
        await transcriptChannel.send({ embeds: [transcript] });

        await ticketChannel.send('This ticket has been closed.');
        await ticketChannel.setName(`closed-${ticketChannel.name}`);
      } else {
        await interaction.reply({ content: 'You do not have permission to close this ticket.', ephemeral: true });
      }
    }
  },

  async loadTicketSetup(client) {
    try {
      const setupFilePath = path.join(__dirname, '..', 'ticketSetup.json');
      const setupData = JSON.parse(fs.readFileSync(setupFilePath, 'utf8'));
      const { messageId, channelId, guildId } = setupData;

      const guild = await client.guilds.fetch(guildId);
      const channel = await guild.channels.fetch(channelId);
      const message = await channel.messages.fetch(messageId);

      this.createCollector(client, message);
      console.log('Ticket system collector recreated successfully.');
    } catch (error) {
      console.error('Failed to load ticket setup:', error);
    }
  },
};