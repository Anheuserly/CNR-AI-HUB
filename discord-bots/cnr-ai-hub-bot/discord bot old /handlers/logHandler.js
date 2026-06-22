const fs = require('fs');
const path = require('path');

module.exports = {
  async logTicketAction(ticketId, action, user) {
    const logPath = path.join(__dirname, '..', 'data', 'logs.json');
    const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    
    logs.push({ ticketId, action, user, timestamp: new Date().toISOString() });
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }
};
