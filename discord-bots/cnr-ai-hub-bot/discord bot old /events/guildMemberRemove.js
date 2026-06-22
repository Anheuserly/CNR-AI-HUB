const { handleMemberLeave } = require('../handlers/welcomeLeaveHandler');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    await handleMemberLeave(member);  // Call your handler when a member leaves
  },
};
