const { handleMemberJoin } = require('../handlers/welcomeLeaveHandler');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    await handleMemberJoin(member);  // Call your handler when a member joins
  },
};
