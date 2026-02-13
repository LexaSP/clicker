// script.js
import { generateRelics, generateResearch, generateIdeas, generateExpeditions, generateRecipes } from './content-gen.js';

// --- Game State ---
let gameState = {
    resources: {
        clicks: 0,
        lifetimeClicks: 0,
        money: 0,
        knowledge: 0,
        culture: 0, // New Currency
        symbolsOfEra: 0,
        relicShards: 0,
        wood: 0,
        stone: 0,
        food: 0
    },
    inventory: [], // Relics
    activeResearch: [], // Currently researching
    researched: [], // Completed research IDs
    ideas: [], // Unlocked ideas
    expeditions: [], // Available
    activeExpeditions: [],
    quests: [], // Daily quests

    prestigeUpgrades: { // Ascension
        "golden_freq": { level: 0, max: 5, cost: 1, name: "Golden Relic Frequency" },
        "starting_clicks": { level: 0, max: 10, cost: 2, name: "Start with 100 Clicks" }
    },

    // Upgrades / Buildings
    buildings: {
        "AutoClicker": { count: 0, cost: 10, production: 1 },
        "Farm": { count: 0, cost: 50, production: 5 },
        "Mine": { count: 0, cost: 200, production: 20 },
        "Lab": { count: 0, cost: 1000, production: 100 } // produces knowledge
    },

    era: "Stone Age",

    settings: {
        autoSave: true
    },

    lastSaveTime: Date.now()
};

// --- Era Config ---
const ERA_DATA = [
    { name: "Stone Age", threshold: 0, className: "era-stone" },
    { name: "Bronze Age", threshold: 1000, className: "era-bronze" },
    { name: "Iron Age", threshold: 5000, className: "era-iron" },
    { name: "Middle Ages", threshold: 20000, className: "era-middle" },
    { name: "Renaissance", threshold: 50000, className: "era-renaissance" },
    { name: "Industrial Age", threshold: 150000, className: "era-industrial" },
    { name: "Modern Age", threshold: 500000, className: "era-modern" },
    { name: "Information Age", threshold: 1000000, className: "era-info" },
    { name: "Future Age", threshold: 5000000, className: "era-future" }
];

// --- Content ---
let allRelics = [];
let allResearch = [];
let allIdeas = [];
let allExpeditions = [];
let allRecipes = [];

// --- Init ---
async function init() {
    console.log("Initializing Game...");

    // Expose for dev panel

    // Load Content
    allRelics = generateRelics();
    allResearch = generateResearch();
    allIdeas = generateIdeas();
    allExpeditions = generateExpeditions();
    allRecipes = generateRecipes();

    console.log(`Loaded: ${allRelics.length} Relics, ${allResearch.length} Techs, ${allIdeas.length} Ideas.`);

    // Load Save if exists
    loadGame();

    // Generate quests if needed
    if (gameState.quests.length === 0) {
        generateDailyQuests();
    }

    // Start Loop
    startGameLoop();

    // Init UI
    initUI();
    window.gameState = gameState;
    window.allResearch = allResearch;
}

// --- Game Loop ---
let lastTick = Date.now();
function startGameLoop() {
    setInterval(() => {
        const now = Date.now();
        const dt = (now - lastTick) / 1000;
        lastTick = now;

        tick(dt);
        updateUI();

        if (gameState.settings.autoSave && Math.random() < 0.01) {
             saveGame();
        }
    }, 100);

    // Autosave every 30s
    setInterval(saveGame, 30000);
}

function tick(dt) {
    // Era Progress
    checkEraProgress();

    // Production
    let production = 0;
    production += gameState.buildings["AutoClicker"].count * gameState.buildings["AutoClicker"].production;
    production += gameState.buildings["Farm"].count * gameState.buildings["Farm"].production;
    production += gameState.buildings["Mine"].count * gameState.buildings["Mine"].production;

    // Knowledge
    let knowledgeProd = gameState.buildings["Lab"].count * gameState.buildings["Lab"].production;

    // Apply Multipliers
    let prodMult = getGlobalMultiplier("production");
    if (gameState.tempMultiplier) prodMult *= gameState.tempMultiplier;

    gameState.resources.clicks += production * prodMult * dt;
    gameState.resources.lifetimeClicks += production * prodMult * dt;
    gameState.resources.knowledge += knowledgeProd * dt;

    // Expedition Progress (Loop over copy)
    [...gameState.activeExpeditions].forEach((exp, index) => {
        exp.progress += dt;
        if (exp.progress >= exp.duration) {
            completeExpedition(exp);
        }
    });

    // Research Progress
    if (gameState.activeResearch.length > 0) {
        // ...
    }

    // Golden Relic Spawner
    // Base chance 0.005. Upgrade multiplies it? Or adds?
    // Let's say upgrade adds 0.001 per level.
    let goldenChance = 0.005;
    if (gameState.prestigeUpgrades && gameState.prestigeUpgrades["golden_freq"]) {
        goldenChance += gameState.prestigeUpgrades["golden_freq"].level * 0.002;
    }

    if (Math.random() < goldenChance) {
        spawnGoldenRelic();
    }
}

window.spawnGoldenRelic = function() {
    // Check if already exists
    if (document.getElementById("golden-relic")) return;

    const div = document.createElement("div");
    div.id = "golden-relic";
    div.innerText = "✨";
    div.style.position = "absolute";
    div.style.fontSize = "40px";
    div.style.cursor = "pointer";
    div.style.userSelect = "none";
    div.style.zIndex = "1000";
    div.style.left = Math.random() * (window.innerWidth - 50) + "px";
    div.style.top = Math.random() * (window.innerHeight - 50) + "px";
    div.style.animation = "floatUp 5s ease-in-out infinite"; // Reusing floatUp or just static

    div.onclick = function() {
        clickGoldenRelic();
        document.body.removeChild(div);
    };

    document.body.appendChild(div);

    // Auto remove after 15s
    setTimeout(() => {
        if (document.body.contains(div)) {
            document.body.removeChild(div);
        }
    }, 15000);
}

function clickGoldenRelic() {
    const roll = Math.random();
    if (roll < 0.5) {
        // Frenzy: x7 for 30s
        alert("GOLDEN RELIC! x7 Production for 30 seconds!");
        // We need a way to store temp buffs.
        // For simplicity, let's just dump resources for now or add a temp multiplier.
        // Let's add a temp multiplier to gameState.
        if (!gameState.tempMultiplier) gameState.tempMultiplier = 1;
        gameState.tempMultiplier *= 7;
        setTimeout(() => {
            gameState.tempMultiplier /= 7;
        }, 30000);
    } else {
        // Lump Sum: 15 mins of production
        let production = 0;
        production += gameState.buildings["AutoClicker"].count * gameState.buildings["AutoClicker"].production;
        production += gameState.buildings["Farm"].count * gameState.buildings["Farm"].production;
        production += gameState.buildings["Mine"].count * gameState.buildings["Mine"].production;
        let gain = Math.max(100, production * 900); // 15 mins

        gameState.resources.clicks += gain;
        gameState.resources.lifetimeClicks += gain;
        alert(`GOLDEN RELIC! Found ${Math.floor(gain)} Clicks!`);
    }
    updateUI();
}

function generateDailyQuests() {
    gameState.quests = [];
    const clickTarget = 500 + Math.floor(gameState.resources.lifetimeClicks / 100);
    gameState.quests.push({
        id: "q_clicks",
        title: `Perform ${clickTarget} Manual Clicks`,
        type: "clicks",
        target: clickTarget,
        progress: 0,
        reward: { clicks: Math.floor(clickTarget * 0.5), se: 1 },
        completed: false,
        claimed: false
    });

    gameState.quests.push({
        id: "q_buy",
        title: "Buy 5 Buildings",
        type: "purchases",
        target: 5,
        progress: 0,
        reward: { clicks: 500, se: 1 },
        completed: false,
        claimed: false
    });

    gameState.quests.push({
        id: "q_shards",
        title: "Find 3 Relic Shards",
        type: "shards",
        target: 3,
        progress: 0,
        reward: { knowledge: 1000, se: 2 },
        completed: false,
        claimed: false
    });
}

function checkQuestProgress(type, amount = 1) {
    gameState.quests.forEach(q => {
        if (!q.completed && q.type === type) {
            q.progress += amount;
            if (q.progress >= q.target) {
                q.progress = q.target;
                q.completed = true;
                console.log(`Quest Completed: ${q.title}`);
            }
        }
    });
}

window.claimQuest = function(questId) {
    const q = gameState.quests.find(q => q.id === questId);
    if (q && q.completed && !q.claimed) {
        q.claimed = true;
        if (q.reward.clicks) gameState.resources.clicks += q.reward.clicks;
        if (q.reward.knowledge) gameState.resources.knowledge += q.reward.knowledge;
        if (q.reward.se) gameState.resources.symbolsOfEra += q.reward.se;
        updateUI();
    }
};

// --- Mechanics ---
function getGlobalMultiplier(type) {
    let mult = 1.0;
    // Relics
    gameState.inventory.forEach(relic => {
        if (relic.effect.type === `${type}_boost` || (type === "production" && relic.effect.type === "production_multiplier")) {
             mult += (relic.effect.value / 100);
        }
        // Specific Cost Reduction
        if (type === "cost" && relic.effect.type === "cost_reduction") {
            mult -= (relic.effect.value / 100);
        }
    });
    // Techs
    gameState.researched.forEach(techId => {
        const tech = allResearch.find(t => t.id === techId);
        if (tech && tech.effect.type === "production_multiplier" && type === "production") {
            mult *= tech.effect.value;
        }
    });

    // Cap cost reduction
    if (type === "cost" && mult < 0.1) mult = 0.1;

    return mult;
}

function getCritStats() {
    let chance = 0.01; // 1% base
    let dmg = 2.0; // 2x base

    gameState.inventory.forEach(relic => {
        if (relic.effect.type === "crit_chance") chance += (relic.effect.value / 100);
        if (relic.effect.type === "crit_damage") dmg += (relic.effect.value / 100);
    });
    return { chance, dmg };
}

window.manualClick = function(event) {
    let clickValue = 1 + (gameState.inventory.length * 0.1);
    clickValue *= getGlobalMultiplier("click");

    // Crit Logic
    const crit = getCritStats();
    let isCrit = false;
    if (Math.random() < crit.chance) {
        clickValue *= crit.dmg;
        isCrit = true;
    }

    clickValue = Math.floor(clickValue);
    gameState.resources.clicks += clickValue;
    gameState.resources.lifetimeClicks += clickValue;

    // Spawn Particle
    if (event) {
        spawnClickParticle(event.clientX, event.clientY, clickValue, isCrit);
    }

    checkQuestProgress("clicks", 1);

    if (Math.random() < 0.05) {
        gameState.resources.relicShards++;
        checkQuestProgress("shards", 1);
    }
    updateUI();
};

function spawnClickParticle(x, y, amount, isCrit) {
    const p = document.createElement("div");
    p.innerText = `+${amount}`;
    p.style.position = "absolute";
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.color = isCrit ? "#e74c3c" : "#f1c40f";
    p.style.fontSize = isCrit ? "20px" : "14px";
    p.style.fontWeight = "bold";
    p.style.pointerEvents = "none";
    p.style.animation = "floatUp 1s ease-out forwards";
    document.body.appendChild(p);

    setTimeout(() => {
        document.body.removeChild(p);
    }, 1000);
}

window.buyBuilding = function(name) {
    const b = gameState.buildings[name];

    // Apply Cost Reduction
    let costMult = getGlobalMultiplier("cost");
    let baseCost = 0;
    if (name === "AutoClicker") baseCost = 10;
    else if (name === "Farm") baseCost = 50;
    else if (name === "Mine") baseCost = 200;
    else if (name === "Lab") baseCost = 1000;

    let nominalCost = Math.floor(baseCost * Math.pow(1.25, b.count));
    let finalCost = Math.floor(nominalCost * costMult);

    if (gameState.resources.clicks >= finalCost) {
        gameState.resources.clicks -= finalCost;
        b.count++;
        // Recalc for UI (nominal)
        b.cost = Math.floor(baseCost * Math.pow(1.25, b.count));

        checkQuestProgress("purchases", 1);
        updateUI();
    }
};

window.buyResearch = function(techId) {
    const tech = allResearch.find(t => t.id === techId);
    if (!tech) return;

    let costMult = getGlobalMultiplier("cost");
    const cost = Math.floor(tech.cost * costMult);

    const reqMet = tech.requirements.every(req => gameState.researched.includes(req));
    const costType = tech.costType || "knowledge"; // Default to knowledge (was clicks? No, original plan said clicks/knowledge mix)

    // Previously we used clicks as placeholder. Now we switch to knowledge/culture.
    // If user has enough resources
    if (reqMet && !gameState.researched.includes(techId)) {
        if (costType === "knowledge" && gameState.resources.knowledge >= cost) {
            gameState.resources.knowledge -= cost;
            gameState.researched.push(techId);
            updateUI();
        } else if (costType === "culture" && gameState.resources.culture >= cost) {
            gameState.resources.culture -= cost;
            gameState.researched.push(techId);
            updateUI();
        } else if (costType === "clicks" && gameState.resources.clicks >= cost) { // Legacy/Early
             gameState.resources.clicks -= cost;
             gameState.researched.push(techId);
             updateUI();
        }
    }
};

// --- Persistence ---
window.saveGame = function() {
    gameState.lastSaveTime = Date.now();
    localStorage.setItem("hc_web_save", JSON.stringify(gameState));
    console.log("Game Saved");
}

function loadGame() {
    const save = localStorage.getItem("hc_web_save");
    if (save) {
        try {
            const savedState = JSON.parse(save);
            Object.assign(gameState, savedState);

            // Offline Progress
            if (gameState.lastSaveTime) {
                const now = Date.now();
                const diff = (now - gameState.lastSaveTime) / 1000;
                if (diff > 60) {
                    calculateOfflineProgress(diff);
                }
            }
        } catch (e) {
            console.error("Failed to load save", e);
        }
    }
}

function calculateOfflineProgress(seconds) {
    let production = 0;
    production += gameState.buildings["AutoClicker"].count * gameState.buildings["AutoClicker"].production;
    production += gameState.buildings["Farm"].count * gameState.buildings["Farm"].production;
    production += gameState.buildings["Mine"].count * gameState.buildings["Mine"].production;

    let prodMult = getGlobalMultiplier("production");
    const clicksGained = Math.floor(production * prodMult * seconds * 0.5);

    if (clicksGained > 0) {
        gameState.resources.clicks += clicksGained;
        gameState.resources.lifetimeClicks += clicksGained;
        alert(`Welcome back! You were gone for ${Math.floor(seconds)} seconds.\nOffline Production: +${clicksGained} Clicks (50% efficiency).`);
    }
}

// --- UI Updates ---
function initUI() {
    renderResearchTree();
}

function checkEraProgress() {
    let currentEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);
    if (currentEraIdx < ERA_DATA.length - 1) {
        const nextEra = ERA_DATA[currentEraIdx + 1];
        if (gameState.resources.clicks >= nextEra.threshold) {
            advanceEra(nextEra);
        }
    }
}

function advanceEra(era) {
    gameState.era = era.name;
    console.log(`Advanced to ${era.name}!`);
}

function calculatePrestigeGain() {
    if (gameState.resources.lifetimeClicks < 100) return 0;
    return Math.floor(Math.log10(1 + gameState.resources.lifetimeClicks));
}

window.exportSave = function() {
    const json = JSON.stringify(gameState);
    const b64 = btoa(json);
    prompt("Copy your save code:", b64);
};

window.importSave = function() {
    const b64 = prompt("Paste your save code:");
    if (!b64) return;
    try {
        const json = atob(b64);
        const data = JSON.parse(json);
        // Basic validation
        if (data.resources && data.buildings) {
            Object.assign(gameState, data);
            saveGame();
            location.reload();
        } else {
            alert("Invalid save file.");
        }
    } catch (e) {
        alert("Error importing save: " + e.message);
    }
};

window.buyPrestigeUpgrade = function(id) {
    const up = gameState.prestigeUpgrades[id];
    if (!up) return;

    // Cost scaling? Static for now based on definition
    const cost = up.cost * (up.level + 1);

    if (gameState.resources.symbolsOfEra >= cost && up.level < up.max) {
        gameState.resources.symbolsOfEra -= cost;
        up.level++;
        updateUI();
    }
};

window.performPrestige = function() {
    const gain = calculatePrestigeGain();
    if (gain <= 0) {
        alert("Not enough progress to prestige!");
        return;
    }

    if (!confirm(`Reset game to gain ${gain} Symbols of Era?`)) return;

    const symbols = gameState.resources.symbolsOfEra + gain;
    const inventory = gameState.inventory;
    const shards = gameState.resources.relicShards;
    const lifetime = gameState.resources.lifetimeClicks;
    const pUpgrades = gameState.prestigeUpgrades; // Keep upgrades

    gameState.resources.clicks = 0;
    // Apply starting clicks upgrade
    if (pUpgrades["starting_clicks"] && pUpgrades["starting_clicks"].level > 0) {
        gameState.resources.clicks = pUpgrades["starting_clicks"].level * 100;
    }
    gameState.resources.money = 0;
    gameState.resources.knowledge = 0;
    gameState.resources.symbolsOfEra = symbols;
    gameState.resources.relicShards = shards;
    gameState.resources.lifetimeClicks = lifetime;

    gameState.activeResearch = [];
    gameState.researched = [];
    gameState.activeExpeditions = [];

    for (let key in gameState.buildings) {
        gameState.buildings[key].count = 0;
        // Reset costs is handled by recalc in loop/buy
    }

    gameState.era = "Stone Age";

    saveGame();
    updateUI();
    console.log("Prestige performed!");
};

function updateUI() {
    const eraInfo = ERA_DATA.find(e => e.name === gameState.era) || ERA_DATA[0];
    document.body.className = eraInfo.className;

    document.getElementById("res-clicks").innerText = Math.floor(gameState.resources.clicks);
    document.getElementById("res-knowledge").innerText = Math.floor(gameState.resources.knowledge);
    document.getElementById("res-culture").innerText = Math.floor(gameState.resources.culture);
    document.getElementById("res-shards").innerText = gameState.resources.relicShards;

    // Loot resources
    const lootContainer = document.getElementById("loot-resources");
    if (lootContainer) {
        lootContainer.innerHTML = `
            <span>Wood: ${gameState.resources.wood}</span> |
            <span>Stone: ${gameState.resources.stone}</span> |
            <span>Food: ${gameState.resources.food}</span>
        `;
    }
    document.getElementById("res-se").innerText = gameState.resources.symbolsOfEra;

    const prestigeBtn = document.getElementById("btn-prestige");
    if (prestigeBtn) {
        const gain = calculatePrestigeGain();
        prestigeBtn.innerText = `Prestige (+${gain} SE)`;
    }

    // Prestige Upgrades
    const ascContainer = document.getElementById("ascension-list");
    if (ascContainer && gameState.prestigeUpgrades) {
        ascContainer.innerHTML = "";
        for (let key in gameState.prestigeUpgrades) {
            const up = gameState.prestigeUpgrades[key];
            const div = document.createElement("div");
            div.style.marginBottom = "5px";
            const cost = up.cost * (up.level + 1);

            const btn = document.createElement("button");
            btn.style.fontSize = "10px";
            btn.style.padding = "2px 5px";
            btn.innerText = `Buy (Cost: ${cost})`;
            btn.disabled = up.level >= up.max || gameState.resources.symbolsOfEra < cost;
            btn.onclick = () => window.buyPrestigeUpgrade(key);

            div.innerHTML = `<small>${up.name} (Lvl ${up.level}/${up.max})</small><br>`;
            div.appendChild(btn);
            ascContainer.appendChild(div);
        }
    }

    for (let name in gameState.buildings) {
        const btn = document.getElementById(`btn-${name}`);
        if (btn) {
            // Need to recalc cost for display as state only has current cost?
            // Actually we are not storing cost in state properly, we recalc it.
            // Let's recalc for display.
            let baseCost = 0;
            if (name === "AutoClicker") baseCost = 10;
            else if (name === "Farm") baseCost = 50;
            else if (name === "Mine") baseCost = 200;
            else if (name === "Lab") baseCost = 1000;
            const cost = Math.floor(baseCost * Math.pow(1.25, gameState.buildings[name].count));

            // Apply discount for display
            let costMult = getGlobalMultiplier("cost");
            const finalCost = Math.floor(cost * costMult);

            btn.innerText = `Buy ${name} (${finalCost}) - Owned: ${gameState.buildings[name].count}`;
            btn.disabled = gameState.resources.clicks < finalCost;
        }
    }

    renderQuests();
    renderInventory();
    renderExpeditions();
    renderCrafting();
    renderResearchTree();
}

function renderCrafting() {
    const container = document.getElementById("recipe-list");
    if (!container) return;

    // Simple clear/redraw
    container.innerHTML = "";
    if (allRecipes.length === 0) {
        container.innerHTML = "<p>No recipes available.</p>";
        return;
    }

    allRecipes.forEach(recipe => {
        const div = document.createElement("div");
        div.className = "recipe-card";

        // Inputs text
        let inputsText = [];
        for (let key in recipe.inputs) {
            inputsText.push(`${recipe.inputs[key]} ${key}`);
        }

        // Output text
        let outputText = [];
        for (let key in recipe.output) {
            outputText.push(`${recipe.output[key]} ${key}`);
        }

        // Check affordability
        let canAfford = true;
        for (let key in recipe.inputs) {
            let resName = key;
            // Map generator names to gameState resources if needed
            // Our generator uses 'stone', 'wood', 'herb', 'water', 'copper', 'tin'
            // We implemented: wood, stone, food, relicShards.
            // Map unknown to 'relicShards' as fallback or assume impossible?
            // Let's implement basics:
            if (resName === "herb" || resName === "water") resName = "food";
            if (resName === "copper" || resName === "tin") resName = "stone";

            const cost = recipe.inputs[key];
            if (gameState.resources[resName] === undefined || gameState.resources[resName] < cost) {
                canAfford = false;
                break;
            }
        }

        div.innerHTML = `
            <strong>${recipe.name}</strong><br>
            <small>Requires: ${inputsText.join(", ")}</small><br>
            <small>Produces: ${outputText.join(", ")}</small><br>
            <button onclick="craftItem('${recipe.id}')" ${canAfford ? '' : 'disabled'}>Craft</button>
        `;

        container.appendChild(div);
    });
}

window.craftItem = function(recipeId) {
    const recipe = allRecipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Validate again
    let canAfford = true;
    for (let key in recipe.inputs) {
        let resName = key;
        if (resName === "herb" || resName === "water") resName = "food";
        if (resName === "copper" || resName === "tin") resName = "stone";

        const cost = recipe.inputs[key];
        if (gameState.resources[resName] === undefined || gameState.resources[resName] < cost) {
            canAfford = false;
            break;
        }
    }

    if (canAfford) {
        // Deduct
        for (let key in recipe.inputs) {
            let resName = key;
            if (resName === "herb" || resName === "water") resName = "food";
            if (resName === "copper" || resName === "tin") resName = "stone";
            gameState.resources[resName] -= recipe.inputs[key];
        }

        // Grant output
        gameState.inventory.push({
            id: `crafted_${Date.now()}`,
            name: `Crafted ${recipe.name}`,
            rarity: "Common",
            description: "Hand-crafted item.",
            effect: { type: "production_boost", value: 1 }
        });

        alert(`Crafted ${recipe.name}!`);
        updateUI();
    } else {
        alert("Not enough resources (Need Stone/Shards)!");
    }
};

function renderInventory() {
    const container = document.getElementById("inventory-list");
    if (!container) return;

    container.innerHTML = "";
    if (gameState.inventory.length === 0) {
        container.innerHTML = "<p>No relics yet.</p>";
        return;
    }

    gameState.inventory.forEach(relic => {
        const div = document.createElement("div");
        div.className = `relic-card rarity-${relic.rarity.toLowerCase()}`;
        div.title = relic.description;
        div.innerHTML = `<strong>${relic.name}</strong><br><small>${relic.rarity}</small>`;
        container.appendChild(div);
    });
}

function renderExpeditions() {
    const container = document.getElementById("expedition-list");
    if (container) {
        container.innerHTML = "";
        const available = allExpeditions.slice(0, 5);

        available.forEach(exp => {
            const div = document.createElement("div");
            div.className = "expedition-card";
            div.innerHTML = `
                <strong>${exp.name}</strong> (${exp.difficulty})<br>
                Duration: ${exp.duration}s<br>
                Cost: ${exp.cost.food} Food (Placeholder)<br>
                <button onclick="startExpedition('${exp.id}')">Start</button>
            `;
            container.appendChild(div);
        });
    }

    const activeContainer = document.getElementById("active-expedition-list");
    if (activeContainer) {
        activeContainer.innerHTML = "";
        if (gameState.activeExpeditions.length === 0) {
            activeContainer.innerHTML = "<p>No active expeditions.</p>";
        } else {
            gameState.activeExpeditions.forEach(exp => {
                const div = document.createElement("div");
                div.className = "expedition-card";
                const pct = Math.min(100, (exp.progress / exp.duration) * 100);
                div.innerHTML = `
                    <strong>${exp.name}</strong><br>
                    Time: ${Math.floor(exp.progress)} / ${exp.duration}s
                    <div class="expedition-progress-bg">
                        <div class="expedition-progress-fill" style="width: ${pct}%"></div>
                    </div>
                `;
                activeContainer.appendChild(div);
            });
        }
    }
}

window.startExpedition = function(expId) {
    if (gameState.activeExpeditions.length >= 3) {
        alert("Max 3 active expeditions!");
        return;
    }

    const template = allExpeditions.find(e => e.id === expId);
    if (!template) return;

    const instance = {
        ...template,
        progress: 0,
        startTime: Date.now()
    };

    gameState.activeExpeditions.push(instance);
    updateUI();
};

function completeExpedition(exp) {
    const index = gameState.activeExpeditions.indexOf(exp);
    if (index > -1) {
        gameState.activeExpeditions.splice(index, 1);
    }

    let log = `Expedition '${exp.name}' complete! `;
    if (exp.rewards.relics > 0) {
        const relic = allRelics[Math.floor(Math.random() * allRelics.length)];
        gameState.inventory.push(relic);
        log += `Found relic: ${relic.name}. `;
    }
    if (exp.rewards.money > 0) {
        gameState.resources.money += exp.rewards.money;
        log += `Gained ${exp.rewards.money} Gold. `;
    }

    if (exp.rewards.loot) {
        const type = exp.rewards.loot.type;
        const amount = exp.rewards.loot.amount;
        if (gameState.resources[type] !== undefined) {
            gameState.resources[type] += amount;
            log += `Gained ${amount} ${type}. `;
        }
    }

    console.log(log);
    alert(log);
    updateUI();
}

function renderQuests() {
    const container = document.getElementById("quest-list");
    if (!container) return;

    container.innerHTML = "";

    if (gameState.quests.length === 0) {
        container.innerHTML = "<p>No active quests.</p>";
        return;
    }

    gameState.quests.forEach(q => {
        const div = document.createElement("div");
        div.className = `quest-card ${q.completed ? 'completed' : ''} ${q.claimed ? 'claimed' : ''}`;

        const title = document.createElement("div");
        title.className = "quest-title";
        title.innerText = q.title;
        div.appendChild(title);

        const progContainer = document.createElement("div");
        progContainer.className = "quest-progress";
        const bar = document.createElement("div");
        bar.className = "quest-bar";
        const pct = Math.min(100, Math.floor((q.progress / q.target) * 100));
        bar.style.width = `${pct}%`;
        progContainer.appendChild(bar);
        div.appendChild(progContainer);

        const status = document.createElement("div");
        status.style.fontSize = "10px";
        status.style.textAlign = "right";
        status.innerText = `${q.progress} / ${q.target}`;
        div.appendChild(status);

        if (q.completed && !q.claimed) {
            const btn = document.createElement("button");
            btn.className = "quest-reward-btn";
            let rewardText = "";
            if (q.reward.clicks) rewardText += `+${q.reward.clicks} Clicks `;
            if (q.reward.se) rewardText += `+${q.reward.se} SE`;
            btn.innerText = `Claim: ${rewardText}`;
            btn.onclick = () => window.claimQuest(q.id);
            div.appendChild(btn);
        } else if (q.claimed) {
            const lbl = document.createElement("div");
            lbl.innerText = "Claimed";
            lbl.style.textAlign = "center";
            lbl.style.fontStyle = "italic";
            div.appendChild(lbl);
        }

        container.appendChild(div);
    });
}

window.renderResearchTree = function() {
    const container = document.getElementById("research-container");
    if (!container) return;

    let svg = document.getElementById("tech-tree-svg");
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "tech-tree-svg";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.position = "absolute";
        svg.style.pointerEvents = "none";
        container.appendChild(svg);
    }
    svg.innerHTML = "";

    const columns = {};
    allResearch.forEach(t => {
        const eraName = t.era || "Stone Age";
        if (!columns[eraName]) columns[eraName] = [];
        columns[eraName].push(t);
    });

    const ERA_WIDTH = 250;
    const NODE_HEIGHT = 80;

    Array.from(container.children).forEach(child => {
        if (child.id !== "tech-tree-svg") container.removeChild(child);
    });

    const positions = {};

    let colIdx = 0;
    for (const era of ERA_DATA) {
        const techs = columns[era.name] || [];
        techs.forEach((tech, rowIdx) => {
            const x = 50 + colIdx * ERA_WIDTH;
            const y = 50 + rowIdx * (NODE_HEIGHT + 20);
            positions[tech.id] = {x, y};

            const reqMet = tech.requirements.every(req => gameState.researched.includes(req));
            const isDone = gameState.researched.includes(tech.id);
            const isAvailable = reqMet;
            const isVisible = isDone || isAvailable || tech.requirements.some(r => gameState.researched.includes(r));

            if (isVisible) {
                const div = document.createElement("div");
                div.className = `tech-node ${isDone ? 'researched' : (isAvailable ? 'available' : 'locked')}`;
                div.innerText = `${tech.name}\n(${tech.cost})`;
                div.style.left = `${x}px`;
                div.style.top = `${y}px`;
                div.onclick = () => window.buyResearch(tech.id);
                container.appendChild(div);
            }
        });
        colIdx++;
    }

    allResearch.forEach(tech => {
        if (!positions[tech.id]) return;

        const reqMet = tech.requirements.every(r => gameState.researched.includes(r));
        const isDone = gameState.researched.includes(tech.id);
        const isVisible = isDone || reqMet || tech.requirements.some(r => gameState.researched.includes(r));

        if (isVisible) {
            tech.requirements.forEach(reqId => {
                if (positions[reqId]) {
                    const start = positions[reqId];
                    const end = positions[tech.id];

                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", start.x + 150);
                    line.setAttribute("y1", start.y + 30);
                    line.setAttribute("x2", end.x);
                    line.setAttribute("y2", end.y + 30);
                    line.setAttribute("class", "tech-line");
                    if (isDone) line.classList.add("active");
                    svg.appendChild(line);
                }
            });
        }
    });
}

// Start
init();
