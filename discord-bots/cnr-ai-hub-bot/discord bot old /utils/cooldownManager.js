const cooldowns = new Map();

function setCooldown(command, userId, duration) {
    const expirationTime = Date.now() + duration;
    cooldowns.set(`${command}-${userId}`, expirationTime);
}

function isCooldownActive(command, userId) {
    const key = `${command}-${userId}`;
    const expirationTime = cooldowns.get(key);
    if (!expirationTime) return false;
    if (Date.now() > expirationTime) {
        cooldowns.delete(key);
        return false;
    }
    return true;
}

module.exports = { setCooldown, isCooldownActive };