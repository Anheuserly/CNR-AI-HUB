const fs = require('fs');
const path = require('path');

let userProfiles = {};
const profilesPath = path.join(__dirname, '..', 'data', 'profiles.json');

// Load profiles from file
function loadProfiles() {
    if (fs.existsSync(profilesPath)) {
        const data = fs.readFileSync(profilesPath, 'utf8');
        userProfiles = JSON.parse(data);
    }
}

// Save profiles to file
function saveProfiles() {
    const data = JSON.stringify(userProfiles, null, 2);
    fs.writeFileSync(profilesPath, data);
}

// Get or create a user profile
function getOrCreateUserProfile(userId) {
    if (!userProfiles[userId]) {
        userProfiles[userId] = {
            health: 100,
            armor: 0,
            money: 0,
            inventory: [],
            shieldAttempts: 0
        };
        saveProfiles();
    }
    return userProfiles[userId];
}

// Weapon data
const weaponData = {
    1: { name: 'Pistol', damage: 20, roleId: '1249710337889144842' },
    2: { name: 'Shotgun', damage: 40, roleId: '1249710339097104444' },
    3: { name: 'Rifle', damage: 30, roleId: '1249711381758873610' },
    4: { name: 'Sniper', damage: 60, roleId: '1249711789713920081' }
};

function getWeaponDamage(weaponId) {
    return weaponData[weaponId]?.damage || 0;
}

function getWeaponName(weaponId) {
    return weaponData[weaponId]?.name || 'Unknown Weapon';
}

module.exports = {
    loadProfiles,
    saveProfiles,
    getOrCreateUserProfile,
    getWeaponDamage,
    getWeaponName
};