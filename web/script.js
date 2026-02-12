// script.js
import { generateRelics, generateResearch, generateIdeas, generateExpeditions, generateRecipes } from './content-gen.js';

// --- Game State ---
let gameState = {
    resources: {
        clicks: 0,
        money: 0,
        knowledge: 0,
        symbolsOfEra: 0,
        relicShards: 0
    },
    inventory: [], // Relics
    activeResearch: [], // Currently researching
    researched: [], // Completed research IDs
    ideas: [], // Unlocked ideas
    expeditions: [], // Available
    activeExpeditions: [],

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
    }
};

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
    window.gameState = gameState;

    // Load Content
    allRelics = generateRelics();
    allResearch = generateResearch();
    allIdeas = generateIdeas();
    allExpeditions = generateExpeditions();
    allRecipes = generateRecipes();

    console.log(`Loaded: ${allRelics.length} Relics, ${allResearch.length} Techs, ${allIdeas.length} Ideas.`);

    // Load Save if exists
    loadGame();

    // Start Loop
    startGameLoop();

    // Init UI
    initUI();
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

        if (gameState.settings.autoSave && Math.random() < 0.01) { // roughly every 10s if 100ms interval? No, 10ms interval -> 100 ticks/s -> 1% chance -> 1s average. Let's rely on explicit save timer.
             saveGame();
        }
    }, 100); // 10 ticks per second

    // Autosave every 30s
    setInterval(saveGame, 30000);
}

function tick(dt) {
    // Production
    let production = 0;
    production += gameState.buildings["AutoClicker"].count * gameState.buildings["AutoClicker"].production;
    production += gameState.buildings["Farm"].count * gameState.buildings["Farm"].production;
    production += gameState.buildings["Mine"].count * gameState.buildings["Mine"].production;

    // Knowledge
    let knowledgeProd = gameState.buildings["Lab"].count * gameState.buildings["Lab"].production;

    // Apply Multipliers (from Relics, Techs)
    let prodMult = getGlobalMultiplier("production");
    let clickMult = getGlobalMultiplier("click");

    gameState.resources.clicks += production * prodMult * dt;
    gameState.resources.knowledge += knowledgeProd * dt;

    // Expedition Progress
    gameState.activeExpeditions.forEach(exp => {
        exp.progress += dt;
        if (exp.progress >= exp.duration) {
            completeExpedition(exp);
        }
    });

    // Research Progress
    if (gameState.activeResearch.length > 0) {
        // Distribute knowledge? Or simply time-based?
        // Let's say research costs knowledge upfront, but takes time to 'unlock'.
        // For now, let's say instant unlock if affordable.
    }
}

// --- Mechanics ---
function getGlobalMultiplier(type) {
    let mult = 1.0;
    // Relics
    gameState.inventory.forEach(relic => {
        if (relic.effect.type === `${type}_boost` || relic.effect.type === "production_multiplier") { // Simple match
             mult += (relic.effect.value / 100);
        }
    });
    // Techs
    gameState.researched.forEach(techId => {
        const tech = allResearch.find(t => t.id === techId);
        if (tech && tech.effect.type === "production_multiplier") {
            mult *= tech.effect.value;
        }
    });
    return mult;
}

window.manualClick = function() {
    let clickValue = 1 + (gameState.inventory.length * 0.1); // Base + relic bonus
    clickValue *= getGlobalMultiplier("click");
    gameState.resources.clicks += clickValue;

    // Chance to find relic shard?
    if (Math.random() < 0.05) {
        gameState.resources.relicShards++;
    }
    updateUI();
};

window.buyBuilding = function(name) {
    const b = gameState.buildings[name];
    if (gameState.resources.clicks >= b.cost) {
        gameState.resources.clicks -= b.cost;
        b.count++;
        b.cost = Math.floor(b.cost * 1.15);
        updateUI();
    }
};

window.buyResearch = function(techId) {
    const tech = allResearch.find(t => t.id === techId);
    if (!tech) return;

    // Check cost (assume clicks for now, or knowledge)
    // Let's use clicks for early game, knowledge for later
    const cost = tech.cost;

    // Check requirements
    const reqMet = tech.requirements.every(req => gameState.researched.includes(req));

    if (reqMet && !gameState.researched.includes(techId) && gameState.resources.clicks >= cost) {
        gameState.resources.clicks -= cost;
        gameState.researched.push(techId);
        updateUI();
    }
};

// --- Persistence ---
function saveGame() {
    localStorage.setItem("hc_web_save", JSON.stringify(gameState));
    console.log("Game Saved");
}

function loadGame() {
    const save = localStorage.getItem("hc_web_save");
    if (save) {
        try {
            const savedState = JSON.parse(save);
            // Merge logic needed for version updates, simple assign for now
            Object.assign(gameState, savedState);
             // Restore inventory objects (if they were just IDs, re-link them. But here we save full objects for simplicity)
        } catch (e) {
            console.error("Failed to load save", e);
        }
    }
}

// --- UI Updates ---
function initUI() {
    // Populate Research Tree UI (Initial)
    renderResearchTree();
}

function updateUI() {
    document.getElementById("res-clicks").innerText = Math.floor(gameState.resources.clicks);
    document.getElementById("res-knowledge").innerText = Math.floor(gameState.resources.knowledge);
    document.getElementById("res-shards").innerText = gameState.resources.relicShards;

    // Update Building buttons
    for (let name in gameState.buildings) {
        const btn = document.getElementById(`btn-${name}`);
        if (btn) {
            btn.innerText = `Buy ${name} (${gameState.buildings[name].cost}) - Owned: ${gameState.buildings[name].count}`;
            btn.disabled = gameState.resources.clicks < gameState.buildings[name].cost;
        }
    }

    // Update Research availability
    renderResearchTree();
}

function renderResearchTree() {
    const container = document.getElementById("research-container");
    if (!container) return;

    // Simple list for now
    container.innerHTML = "";
    allResearch.forEach(tech => {
        // Show if requirements met or already researched
        const reqMet = tech.requirements.every(req => gameState.researched.includes(req));
        const isDone = gameState.researched.includes(tech.id);

        if (reqMet || isDone) { // Or visible but locked
             const div = document.createElement("div");
             div.className = `tech-node ${isDone ? 'researched' : ''}`;
             div.innerText = `${tech.name} (${tech.cost})`;
             div.onclick = () => window.buyResearch(tech.id);
             if (isDone) div.style.backgroundColor = "#4caf50";
             container.appendChild(div);
        }
    });
}

// Start
init();
