// achievements.js
// List of all achievements and their unlock conditions

export const ACHIEVEMENTS = [
    {
        id: "first_steps",
        name: "First Steps",
        description: "Perform your first manual click.",
        icon: "👆",
        check: (state) => state.resources.lifetimeClicks >= 1
    },
    {
        id: "apprentice",
        name: "Apprentice Clicker",
        description: "Reach 1,000 lifetime clicks.",
        icon: "🔨",
        check: (state) => state.resources.lifetimeClicks >= 1000
    },
    {
        id: "master",
        name: "Master Clicker",
        description: "Reach 100,000 lifetime clicks.",
        icon: "👑",
        check: (state) => state.resources.lifetimeClicks >= 100000
    },
    {
        id: "millionaire",
        name: "Millionaire",
        description: "Reach 1,000,000 lifetime clicks.",
        icon: "💰",
        check: (state) => state.resources.lifetimeClicks >= 1000000
    },
    // Production
    {
        id: "builder",
        name: "Builder",
        description: "Own 10 buildings.",
        icon: "🏗️",
        check: (state) => Object.values(state.buildings).reduce((a, b) => a + b.count, 0) >= 10
    },
    {
        id: "industrialist",
        name: "Industrialist",
        description: "Own 100 buildings.",
        icon: "🏭",
        check: (state) => Object.values(state.buildings).reduce((a, b) => a + b.count, 0) >= 100
    },
    // Research
    {
        id: "scholar",
        name: "Scholar",
        description: "Research 5 technologies.",
        icon: "📜",
        check: (state) => state.researched.length >= 5
    },
    {
        id: "scientist",
        name: "Scientist",
        description: "Research 25 technologies.",
        icon: "🔬",
        check: (state) => state.researched.length >= 25
    },
    // Exploration
    {
        id: "explorer",
        name: "Explorer",
        description: "Complete 5 expeditions.",
        icon: "🧭",
        check: (state) => state.stats && state.stats.expeditionsCompleted >= 5
    },
    // Relics
    {
        id: "collector",
        name: "Collector",
        description: "Find 3 relics.",
        icon: "🏺",
        check: (state) => state.inventory.length >= 3
    },
    // Eras
    {
        id: "bronze_age",
        name: "Bronze Age",
        description: "Reach the Bronze Age.",
        icon: "⚔️",
        check: (state) => state.era === "Bronze Age" || state.era !== "Stone Age" // Assuming order
    },
    {
        id: "iron_age",
        name: "Iron Age",
        description: "Reach the Iron Age.",
        icon: "🛡️",
        check: (state) => state.era === "Iron Age"
    }
    // ... add more as needed
];

export function checkAchievements(gameState) {
    const unlocked = [];
    if (!gameState.achievements) gameState.achievements = [];

    ACHIEVEMENTS.forEach(ach => {
        if (!gameState.achievements.includes(ach.id)) {
            if (ach.check(gameState)) {
                gameState.achievements.push(ach.id);
                unlocked.push(ach);
            }
        }
    });

    return unlocked;
}
