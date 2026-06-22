const { reopenTicket } = require('../../handlers/ticketHandler');

module.exports = {
  name: 'reopenticket',
  description: 'Reopen a closed ticket',

  async execute(message, args, client) {
    await reopenTicket(message, client);
  },
};
