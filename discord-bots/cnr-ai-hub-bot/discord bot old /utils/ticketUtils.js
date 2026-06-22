const fs = require('fs');
const path = require('path');

module.exports = {
  ticketExists(ticketId) {
    const ticketPath = path.join(__dirname, '..', 'data', 'tickets.json');
    const tickets = JSON.parse(fs.readFileSync(ticketPath, 'utf8'));

    return tickets.some(ticket => ticket.id === ticketId);
  },
};
