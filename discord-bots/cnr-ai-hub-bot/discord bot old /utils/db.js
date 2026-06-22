const fs = require('fs');
const path = require('path');

module.exports = {
  saveTicket(ticketData) {
    const filePath = path.join(__dirname, '..', 'data', 'tickets.json');
    const tickets = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    tickets.push(ticketData);
    fs.writeFileSync(filePath, JSON.stringify(tickets, null, 2));
  },

  getTickets() {
    const filePath = path.join(__dirname, '..', 'data', 'tickets.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
};
