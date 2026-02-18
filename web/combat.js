// combat.js

export const UNITS = {
    "Warrior": { name: "Warrior", type: "infantry", attack: 2, health: 10, cost: { food: 50, clicks: 100 }, icon: "🪓", era: "Stone Age" },
    "Archer": { name: "Archer", type: "ranged", attack: 5, health: 5, cost: { food: 100, wood: 50 }, icon: "🏹", era: "Bronze Age" },
    "Horseman": { name: "Horseman", type: "cavalry", attack: 8, health: 15, cost: { food: 200 }, icon: "🐎", era: "Bronze Age" },
    "Legionnaire": { name: "Legionnaire", type: "infantry", attack: 10, health: 20, cost: { food: 200, stone: 100 }, icon: "🛡️", era: "Iron Age" },
    "Knight": { name: "Knight", type: "cavalry", attack: 25, health: 40, cost: { food: 500, stone: 200 }, icon: "🏇", era: "Middle Ages" },
    "Musketeer": { name: "Musketeer", type: "ranged", attack: 50, health: 30, cost: { food: 800, stone: 300 }, icon: "🔫", era: "Renaissance" },
    "Tank": { name: "Tank", type: "cavalry", attack: 200, health: 500, cost: { money: 1000, stone: 500 }, icon: "🚜", era: "Industrial Age" }
};

export const TACTICS = [
    { id: "charge", name: "Full Charge", desc: "Cav +50% Atk, Inf -20% Def", bonus: { cavalry: 1.5, infantry_def: 0.8 } },
    { id: "shield_wall", name: "Shield Wall", desc: "Inf +50% Def, Ranged +20% Atk, Cav -50% Atk", bonus: { infantry_def: 1.5, ranged: 1.2, cavalry: 0.5 } },
    { id: "flanking", name: "Flanking", desc: "All +20% Atk", bonus: { all: 1.2 } },
    { id: "guerrilla", name: "Guerrilla", desc: "Ranged +50% Atk, Inf -20% Def", bonus: { ranged: 1.5, infantry_def: 0.8 } }
];

export const RIVALS = [
    { name: "Barbarians", power: 10, loot: { money: 100 } },
    { name: "City State", power: 50, loot: { knowledge: 500 } },
    { name: "Empire", power: 200, loot: { money: 1000, culture: 500 } },
    { name: "Global Power", power: 1000, loot: { relicShards: 5 } }
];

export function calculateArmyPower(army, tacticId = null) {
    let power = 0;
    const tactic = TACTICS.find(t => t.id === tacticId) || { bonus: {} };

    for (let unitType in army) {
        const count = army[unitType];
        const u = UNITS[unitType];
        if (u) {
            let atk = u.attack;
            let def = u.health * 0.5;

            // Tactic Bonuses
            if (tactic.bonus.all) { atk *= tactic.bonus.all; def *= tactic.bonus.all; }

            if (u.type === "cavalry" && tactic.bonus.cavalry) atk *= tactic.bonus.cavalry;
            if (u.type === "ranged" && tactic.bonus.ranged) atk *= tactic.bonus.ranged;
            if (u.type === "infantry" && tactic.bonus.infantry) atk *= tactic.bonus.infantry;
            if (u.type === "infantry" && tactic.bonus.infantry_def) def *= tactic.bonus.infantry_def;

            power += (atk * count) + (def * count);
        }
    }
    return Math.floor(power);
}

export function resolveCombat(playerArmy, rival, powerMultiplier = 1.0, tacticId = null) {
    const playerPower = calculateArmyPower(playerArmy, tacticId) * powerMultiplier;
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
