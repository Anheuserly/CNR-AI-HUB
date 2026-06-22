module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
      if (!interaction.isCommand()) return;
  
      const command = interaction.client.slashCommands.get(interaction.commandName);
  
      if (!command) return;
  
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing slash command ${interaction.commandName}:`, error);
        await interaction.reply({
          content: 'There was an error executing that command.',
          ephemeral: true,
        });
      }
    },
  };
  