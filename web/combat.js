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

export const BATTLE_CONSTANTS = {
    BASE_DPS_RATE: 0.1, // 10% of power per second
    RESOURCE_DRAIN: 0.5, // 0.5 per unit per second
    WEARINESS_RATE: 0.2 // 0.2 per second (slow accumulation)
};

export const RIVAL_TACTICS = {
    "Aggressive": { dmgDealt: 1.5, dmgTaken: 1.5 },
    "Defensive": { dmgDealt: 0.7, dmgTaken: 0.7 },
    "Balanced": { dmgDealt: 1.0, dmgTaken: 1.0 }
};

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

// Deprecated: Instant combat (kept for compatibility or reference, but we will use startBattle)
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

// --- New Battle System ---

export function startBattle(gameState, rivalIdx, tacticId, playerMultiplier = 1.0) {
    const rival = RIVALS[rivalIdx];
    if (!rival) return { success: false, msg: "Rival not found" };

    if (!gameState.army || Object.keys(gameState.army).length === 0) {
        return { success: false, msg: "No army to fight with!" };
    }

    // Calculate Powers
    // Note: playerMultiplier (Global Multiplier) is stored to be applied dynamically or snapshot?
    // Let's snapshot the multiplier for simplicity, assuming tech doesn't change mid-battle significantly.
    const playerBasePower = calculateArmyPower(gameState.army, tacticId);
    const playerRealPower = playerBasePower * playerMultiplier;

    // Enemy Tactic
    const enemyTacticKeys = Object.keys(RIVAL_TACTICS);
    const enemyTacticName = enemyTacticKeys[Math.floor(Math.random() * enemyTacticKeys.length)];

    gameState.battle = {
        active: true,
        rivalIdx: rivalIdx,
        rival: JSON.parse(JSON.stringify(rival)), // Deep copy
        tacticId: tacticId,
        enemyTactic: enemyTacticName,
        playerStartPower: playerRealPower,
        playerCurrentPower: playerRealPower,
        enemyStartPower: rival.power,
        enemyCurrentPower: rival.power,
        startTime: Date.now(),
        duration: 0,
        log: []
    };

    return { success: true, msg: `Battle started against ${rival.name}!` };
}

export function updateBattle(gameState, dt, playerMultiplier = 1.0) {
    if (!gameState.battle || !gameState.battle.active) return;

    const b = gameState.battle;
    const enemyTactic = RIVAL_TACTICS[b.enemyTactic];

    // Update Duration
    b.duration += dt;

    // 1. Calculate DPS
    // Player DPS = (Current Power) * Rate * Enemy Vulnerability
    // Note: We use current power. If units die (power drops), DPS drops.
    // But we are simulating power drop via HP drop.
    // So playerCurrentPower is the proxy for remaining army strength.

    // Check for paused/lag spikes
    if (dt > 1) dt = 1; // Cap dt to 1s to avoid huge jumps

    const playerDPS = b.playerCurrentPower * BATTLE_CONSTANTS.BASE_DPS_RATE * enemyTactic.dmgTaken;
    const enemyDPS = b.enemyCurrentPower * BATTLE_CONSTANTS.BASE_DPS_RATE * enemyTactic.dmgDealt;

    // 2. Apply Damage
    b.enemyCurrentPower -= playerDPS * dt;
    b.playerCurrentPower -= enemyDPS * dt;

    // 3. Resource Drain
    let totalUnits = 0;
    if (gameState.army) Object.values(gameState.army).forEach(c => totalUnits += c);

    // Cost: 0.5 Gold OR Food per unit per second
    const drain = totalUnits * BATTLE_CONSTANTS.RESOURCE_DRAIN * dt;
    let starvation = false;

    if (gameState.resources.money >= drain) {
        gameState.resources.money -= drain;
    } else if (gameState.resources.food >= drain) {
        gameState.resources.food -= drain;
    } else {
        // Starvation: Extra damage taken
        starvation = true;
        b.playerCurrentPower -= enemyDPS * dt * 0.5; // 50% more dmg
    }

    // 4. War Weariness
    if (gameState.warWeariness === undefined) gameState.warWeariness = 0;
    gameState.warWeariness += BATTLE_CONSTANTS.WEARINESS_RATE * dt;

    // 5. Check End Conditions
    if (b.enemyCurrentPower <= 0) {
        endBattle(gameState, "win");
    } else if (b.playerCurrentPower <= 0) {
        endBattle(gameState, "loss");
    }
}

export function retreatBattle(gameState) {
    if (!gameState.battle || !gameState.battle.active) return;
    endBattle(gameState, "retreat");
}

export function endBattle(gameState, result) {
    const b = gameState.battle;
    b.active = false;
    b.result = result;

    // Calculate Losses
    // Loss % = (Start - Current) / Start
    let lossPct = 1 - (b.playerCurrentPower / b.playerStartPower);
    if (lossPct < 0) lossPct = 0;

    if (result === "loss") lossPct = 1.0; // Wipeout
    if (result === "retreat") lossPct += 0.1; // 10% penalty
    if (lossPct > 1) lossPct = 1;

    // Apply to units
    const losses = {};
    for (let key in gameState.army) {
        const count = gameState.army[key];
        const lost = Math.floor(count * lossPct);
        if (lost > 0) {
            losses[key] = lost;
            gameState.army[key] -= lost;
        }
    }
    b.finalLosses = losses;

    // Loot
    let lootMsg = "";
    if (result === "win") {
        const loot = b.rival.loot;
        for (let k in loot) {
            if (!gameState.resources[k]) gameState.resources[k] = 0;
            gameState.resources[k] += loot[k];
            lootMsg += `\n+ ${loot[k]} ${k}`;
        }
        b.resultMsg = "VICTORY! " + lootMsg;
    } else if (result === "loss") {
        b.resultMsg = "DEFEAT! Army wiped out.";
    } else {
        b.resultMsg = "RETREATED. Army suffered casualties.";
    }
}
