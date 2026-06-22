const { assignTicket } = require('../../handlers/ticketHandler');

module.exports = {
  name: 'assignticket',
  description: 'Assign a ticket to a staff member',

  async execute(message, args, client) {
    const staffMember = args[0];
    await assignTicket(message, staffMember, client);
  },
};
