module.exports = {
    checkPermissions: (message, command) => {
      if (!message.member.permissions.has(command.requiredPermissions || [])) {
        message.reply('You do not have permission to use this command.');
        return false;
      }
      return true;
    }
  };
  