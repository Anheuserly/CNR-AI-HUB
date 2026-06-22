const fs = require('fs').promises;
const path = require('path');

const SAVE_DATA_FOLDER = path.join(__dirname, '..', '..', 'savedata');
const userProfiles = new Map(); // Assuming this holds user profiles

async function ensureSaveDataFolder() {
    try {
        await fs.mkdir(SAVE_DATA_FOLDER, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error('Error creating save data folder:', error);
        }
    }
}

async function getOrCreateUserProfile(userId) {
    await ensureSaveDataFolder();
    const userProfilePath = path.join(SAVE_DATA_FOLDER, `${userId}.json`);

    try {
        const data = await fs.readFile(userProfilePath, 'utf8');
        const profile = JSON.parse(data);
        userProfiles.set(userId, profile); // Cache the profile
        return profile;
    } catch (error) {
        if (error.code === 'ENOENT') {
            const newProfile = {
                userId: userId,
                markedMoney: 0, // Initialize marked money
                currency: 0,
                level: 1,
                experience: 0,
                inventory: [],
                lastDailyClaim: null,
                armor: 0,
                health: 100,
                maxHealth: 100,
                isDead: false
            };
            await saveUserProfile(userId, newProfile);
            return newProfile;
        } else {
            console.error('Error reading user profile:', error);
            throw error;
        }
    }
}

async function saveUserProfile(userId, profile) {
    await ensureSaveDataFolder();
    const userProfilePath = path.join(SAVE_DATA_FOLDER, `${userId}.json`);
    await fs.writeFile(userProfilePath, JSON.stringify(profile, null, 2));
}

async function updateMarkedMoney(userId, amount) {
    const profile = await getOrCreateUserProfile(userId);
    profile.markedMoney += amount; // Update the marked money
    await saveUserProfile(userId, profile); // Save the updated profile
}

// Add this function to clear the user's inventory
async function clearUserInventory(userId) {
    const profile = await getOrCreateUserProfile(userId);
    profile.inventory = []; // Reset the inventory to an empty array
    await saveUserProfile(userId, profile); // Save the updated profile
}

async function updateHealth(userId, newHealth) {
    const profile = await getOrCreateUserProfile(userId);
    profile.health = newHealth; // Set the new health
    profile.maxHealth = newHealth; // Optionally set maxHealth to match
    await saveUserProfile(userId, profile); // Save the updated profile
}




module.exports = {
    getOrCreateUserProfile,
    saveUserProfile,
    updateMarkedMoney,
    clearUserInventory, // Export the new function
    updateHealth, // Export the new function
   
};
