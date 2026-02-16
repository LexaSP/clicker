// achievements.js
// List of all achievements and their unlock conditions

// Helper to format numbers
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "k";
    return num;
}

const BUILDINGS_LIST = [
    "AutoClicker", "Gatherer", "Farm", "Mine", "Workshop", "Aqueduct",
    "University", "Bank", "Factory", "Lab", "PowerPlant", "Supercomputer", "FusionReactor"
];

const RESOURCES_LIST = [
    "money", "knowledge", "wood", "stone", "food", "iron", "steel", "oil", "uranium", "energy", "culture"
];

const ERAS = [
    "Stone Age", "Bronze Age", "Iron Age", "Middle Ages", "Renaissance",
    "Industrial Age", "Modern Age", "Information Age", "Future Age"
];

function generateAchievementList() {
    const list = [];

    // 1. Click Milestones (Powers of 10)
    let clickTarget = 100;
    for (let i = 1; i <= 25; i++) {
        list.push({
            id: `clicks_${i}`,
            name: `Clicker Level ${i}`,
            description: `Reach ${formatNumber(clickTarget)} lifetime clicks.`,
            icon: "👆",
            check: (state) => state.resources.lifetimeClicks >= clickTarget
        });
        clickTarget *= 10;
    }

    // 2. Building Counts (Specific)
    BUILDINGS_LIST.forEach(b => {
        const tiers = [1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 5000];
        tiers.forEach(count => {
            list.push({
                id: `build_${b}_${count}`,
                name: `${b} Owner ${count}`,
                description: `Own ${count} ${b}s.`,
                icon: "🏗️",
                check: (state) => state.buildings[b] && state.buildings[b].count >= count
            });
        });
    });

    // 3. Total Buildings
    const totalTiers = [10, 50, 100, 250, 500, 1000, 2500, 5000];
    totalTiers.forEach(count => {
        list.push({
            id: `total_build_${count}`,
            name: `Architect ${count}`,
            description: `Own ${count} total buildings.`,
            icon: "🏙️",
            check: (state) => Object.values(state.buildings).reduce((a, b) => a + b.count, 0) >= count
        });
    });

    // 4. Resource Stockpiles
    RESOURCES_LIST.forEach(res => {
        let amount = 1000;
        for (let i = 1; i <= 20; i++) {
            list.push({
                id: `res_${res}_${i}`,
                name: `${res.charAt(0).toUpperCase() + res.slice(1)} Baron ${i}`,
                description: `Possess ${formatNumber(amount)} ${res}.`,
                icon: "💰",
                check: (state) => state.resources[res] >= amount
            });
            amount *= 5; // Smaller steps to generate more cheevos
        }
    });

    // 5. Research Progress
    const techTiers = [5, 10, 25, 50, 75, 100, 150, 200];
    techTiers.forEach(count => {
        list.push({
            id: `tech_${count}`,
            name: `Scientist ${count}`,
            description: `Research ${count} technologies.`,
            icon: "🔬",
            check: (state) => state.researched.length >= count
        });
    });

    // 6. Relic Hunter
    const relicTiers = [1, 5, 10, 20, 50, 100];
    relicTiers.forEach(count => {
        list.push({
            id: `relic_${count}`,
            name: `Archaeologist ${count}`,
            description: `Find ${count} relics.`,
            icon: "🏺",
            check: (state) => state.inventory.length >= count
        });
    });

    // 7. Era Progression
    ERAS.forEach(era => {
        list.push({
            id: `era_${era.replace(/\s/g, '')}`,
            name: `Welcome to the ${era}`,
            description: `Reach the ${era}.`,
            icon: "⏳",
            check: (state) => state.era === era || ERAS.indexOf(state.era) > ERAS.indexOf(era)
        });
    });

    // 8. Miscellaneous
    list.push({
        id: "expedition_10",
        name: "Adventurer",
        description: "Complete 10 Expeditions",
        icon: "🧭",
        check: (state) => state.stats.expeditionsCompleted >= 10
    });
    list.push({
        id: "expedition_100",
        name: "Veteran Explorer",
        description: "Complete 100 Expeditions",
        icon: "🧭",
        check: (state) => state.stats.expeditionsCompleted >= 100
    });

    return list;
}

export const ACHIEVEMENTS = generateAchievementList();

export function checkAchievements(gameState) {
    const unlocked = [];
    if (!gameState.achievements) gameState.achievements = [];

    // Optimization: Don't iterate all 500+ if most are done.
    // But for now simple iteration is safe for ~1000 items in JS.

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
