// combat.js

export const UNITS = {
    "Warrior": { name: "Warrior", attack: 2, health: 10, cost: { food: 50, clicks: 100 }, icon: "🪓", era: "Stone Age" },
    "Archer": { name: "Archer", attack: 5, health: 5, cost: { food: 100, wood: 50 }, icon: "🏹", era: "Bronze Age" },
    "Legionnaire": { name: "Legionnaire", attack: 10, health: 20, cost: { food: 200, stone: 100 }, icon: "🛡️", era: "Iron Age" },
    "Knight": { name: "Knight", attack: 25, health: 40, cost: { food: 500, stone: 200 }, icon: "🏇", era: "Middle Ages" },
    "Musketeer": { name: "Musketeer", attack: 50, health: 30, cost: { food: 800, stone: 300 }, icon: "🔫", era: "Renaissance" },
    "Tank": { name: "Tank", attack: 200, health: 500, cost: { money: 1000, stone: 500 }, icon: "🚜", era: "Industrial Age" }
};

export const RIVALS = [
    { name: "Barbarians", power: 10, loot: { money: 100 } },
    { name: "City State", power: 50, loot: { knowledge: 500 } },
    { name: "Empire", power: 200, loot: { money: 1000, culture: 500 } },
    { name: "Global Power", power: 1000, loot: { relicShards: 5 } }
];

export function calculateArmyPower(army) {
    let power = 0;
    for (let unitType in army) {
        const count = army[unitType];
        if (UNITS[unitType]) {
            power += (UNITS[unitType].attack * count) + (UNITS[unitType].health * 0.5 * count);
        }
    }
    return Math.floor(power);
}

export function resolveCombat(playerArmy, rival, powerMultiplier = 1.0) {
    const playerPower = calculateArmyPower(playerArmy) * powerMultiplier;
    // Simple RNG variance +/- 20%
    const effectivePlayer = playerPower * (0.8 + Math.random() * 0.4);
    const effectiveRival = rival.power * (0.8 + Math.random() * 0.4);

    const win = effectivePlayer >= effectiveRival;

    // Casualties: 10-30% on win, 50-80% on loss
    const lossRate = win ? (0.1 + Math.random() * 0.2) : (0.5 + Math.random() * 0.3);

    const losses = {};
    for (let unitType in playerArmy) {
        const count = playerArmy[unitType];
        const lost = Math.floor(count * lossRate);
        if (lost > 0) {
            losses[unitType] = lost;
            playerArmy[unitType] -= lost;
        }
    }

    return {
        win: win,
        playerPower: Math.floor(effectivePlayer),
        rivalPower: Math.floor(effectiveRival),
        losses: losses,
        loot: win ? rival.loot : null
    };
}
