// script.js
import { generateRelics, generateResearch, generateIdeas, generateExpeditions, generateRecipes } from './content-gen.js';
import { AudioController } from './audio.js';
import { ACHIEVEMENTS, checkAchievements } from './achievements.js';
import { RANDOM_EVENTS } from './events.js';
import { PARADOXES, checkParadoxes, getParadoxMultiplier } from './paradox.js';
import { UNITS, RIVALS, calculateArmyPower, resolveCombat } from './combat.js';
import { generatePlanets, colonizePlanet, getSpaceProduction } from './space.js';
import { generateGPP, recruitHero, getHeroMultiplier } from './heroes.js';
import { GOVERNMENTS, POLICIES, adoptGovernment, togglePolicy, getGovernmentMultiplier } from './government.js';
import { checkCrisis, fightCrisis, CRISIS_STAGES } from './crisis.js';
import { CIVILIZATIONS, getCivMultiplier } from './civilizations.js';

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
    achievements: [], // Unlocked achievements
    paradoxes: [], // Triggered paradoxes
    army: {}, // { "Warrior": 10, ... }
    space: { planets: [] }, // Space exploration
    heroes: { owned: [], gpp: 0, threshold: 1000 }, // Great People
    government: { type: "gov_tribal", policies: [] }, // Government
    crisis: { active: false, threat: 0, defeated: false }, // Endgame
    civilizationHistory: {}, // { "Bronze Age": { id: "egypt", ... } }

    stats: {
        totalClicks: 0, // Manual clicks
        expeditionsCompleted: 0,
        relicsFound: 0,
        buildingsBought: 0,
        techsResearched: 0,
        history: {} // Per era stats
    },

    prestigeUpgrades: { // Ascension
        "golden_freq": { level: 0, max: 5, cost: 1, name: "Golden Relic Frequency" },
        "starting_clicks": { level: 0, max: 10, cost: 2, name: "Start with 100 Clicks" }
    },

    // Upgrades / Buildings
    buildings: {
        "AutoClicker": { count: 0, cost: 10, production: 1, icon: "👆" },
        "Farm": { count: 0, cost: 50, production: 5, icon: "🌾" },
        "Mine": { count: 0, cost: 200, production: 20, icon: "⛏️" },
        "Lab": { count: 0, cost: 1000, production: 100, icon: "🔬" } // produces knowledge
    },

    era: "Stone Age",

    settings: {
        autoSave: true
    },

    reroll: { count: 0, cost: 100, lastReset: Date.now() },
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

    // Reset daily reroll if 24h passed
    const now = Date.now();
    if (now - gameState.reroll.lastReset > 24 * 60 * 60 * 1000) {
        gameState.reroll.count = 0;
        gameState.reroll.cost = 100;
        gameState.reroll.lastReset = now;
    }

    // Generate quests if needed
    if (gameState.quests.length === 0) {
        generateDailyQuests();
    }

    // Start Loop
    startGameLoop();

    // Init UI
    initUI();

    // Init Audio
    window.audioController = new AudioController();

    window.gameState = gameState;
    window.allResearch = allResearch;

    // Event Tick
    setInterval(() => checkStoryEvents(), 15000); // Check every 15s
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

    // Space Production
    const spaceProd = getSpaceProduction(gameState);
    gameState.resources.money += spaceProd.money * dt;
    gameState.resources.knowledge += spaceProd.knowledge * dt;

    // GPP
    generateGPP(gameState, dt);

    // Crisis
    checkCrisis(gameState, dt);

    // Apply Multipliers
    let prodMult = getGlobalMultiplier("production");
    if (gameState.tempMultiplier) prodMult *= gameState.tempMultiplier;

    // Paradox Multipliers (Resource Specific)
    const clickParadox = getParadoxMultiplier(gameState, "production_mult", "clicks");
    prodMult *= clickParadox;

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
    let goldenChance = 0.005;
    if (gameState.prestigeUpgrades && gameState.prestigeUpgrades["golden_freq"]) {
        goldenChance += gameState.prestigeUpgrades["golden_freq"].level * 0.002;
    }

    if (Math.random() < goldenChance) {
        spawnGoldenRelic();
    }

    // Check Achievements periodically (every tick is fine for small list)
    if (Math.random() < 0.1) { // Throttle slightly
        const newUnlocks = checkAchievements(gameState);
        if (newUnlocks.length > 0) {
            newUnlocks.forEach(ach => {
                showAchievementToast(ach);
                if (window.audioController) window.audioController.playEvent();
            });
        }
    }
}

function checkStoryEvents() {
    // 5% chance per check (15s)
    if (Math.random() > 0.05) return;

    const possible = RANDOM_EVENTS.filter(evt => evt.trigger && evt.trigger(gameState));
    if (possible.length === 0) return;

    // Pick one
    const event = possible[Math.floor(Math.random() * possible.length)];
    renderEventModal(event);
    if (window.audioController) window.audioController.playEvent();
}

function renderEventModal(event) {
    if (document.getElementById("event-modal")) return; // Already open

    const modal = document.createElement("div");
    modal.id = "event-modal";
    modal.className = "modal-overlay";

    let optionsHtml = "";
    event.options.forEach((opt, idx) => {
        // Evaluate check if exists
        let disabled = false;
        if (opt.check && !opt.check(gameState)) disabled = true;

        optionsHtml += `<button class="event-option-btn" ${disabled ? 'disabled' : ''} onclick="resolveEvent('${event.id}', ${idx})">${opt.text}</button>`;
    });

    modal.innerHTML = `
        <div class="modal-content">
            <h2>${event.title}</h2>
            <p>${event.text}</p>
            <div class="event-options">
                ${optionsHtml}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Expose for testing
window.renderEventModal = renderEventModal;

window.resolveEvent = function(eventId, optionIdx) {
    const event = RANDOM_EVENTS.find(e => e.id === eventId);
    if (!event) return;

    const option = event.options[optionIdx];
    // Check cost again
    if (option.check && !option.check(gameState)) return;

    const result = option.action(gameState);
    if (result) alert(result);

    const modal = document.getElementById("event-modal");
    if (modal) document.body.removeChild(modal);
    updateUI();
};

function showAchievementToast(ach) {
    const toast = document.createElement("div");
    toast.className = "achievement-toast";
    toast.innerHTML = `
        <div style="font-size: 24px; margin-right: 10px;">${ach.icon}</div>
        <div>
            <strong>Achievement Unlocked!</strong><br>
            <span>${ach.name}</span><br>
            <small>${ach.description}</small>
        </div>
    `;
    document.body.appendChild(toast);

    // Animation
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 100);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        setTimeout(() => document.body.removeChild(toast), 500);
    }, 4000);
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

    // Paradox Check
    mult *= getParadoxMultiplier(gameState, type, null);

    // Hero Check
    mult *= getHeroMultiplier(gameState, type, null);

    // Government Check
    mult *= getGovernmentMultiplier(gameState, type, null);

    // Civilizations Check
    mult *= getCivMultiplier(gameState, type, null);

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
    if (window.audioController) window.audioController.playClick();
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

    // Stats
    if (!gameState.stats) gameState.stats = {}; // Migration
    if (!gameState.stats.totalClicks) gameState.stats.totalClicks = 0;
    gameState.stats.totalClicks++;

    // Track History
    if (!gameState.stats.history) gameState.stats.history = {};
    if (!gameState.stats.history[gameState.era]) gameState.stats.history[gameState.era] = {};
    if (!gameState.stats.history[gameState.era].clicks) gameState.stats.history[gameState.era].clicks = 0;
    gameState.stats.history[gameState.era].clicks++;

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
        if (window.audioController) window.audioController.playBuy();
        gameState.resources.clicks -= finalCost;
        b.count++;

        // Stats
        if (!gameState.stats) gameState.stats = {};
        if (!gameState.stats.buildingsBought) gameState.stats.buildingsBought = 0;
        gameState.stats.buildingsBought++;

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
        let purchased = false;
        if (costType === "knowledge" && gameState.resources.knowledge >= cost) {
            gameState.resources.knowledge -= cost;
            purchased = true;
        } else if (costType === "culture" && gameState.resources.culture >= cost) {
            gameState.resources.culture -= cost;
            purchased = true;
        } else if (costType === "clicks" && gameState.resources.clicks >= cost) { // Legacy/Early
             gameState.resources.clicks -= cost;
             purchased = true;
        }

        if (purchased) {
            if (window.audioController) window.audioController.playUnlock();
            gameState.researched.push(techId);

            // Stats
            if (!gameState.stats) gameState.stats = {};
            if (!gameState.stats.techsResearched) gameState.stats.techsResearched = 0;
            gameState.stats.techsResearched++;

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
    // Intercept: Check if we need to choose a Civ
    // Stone Age doesn't have a choice (starts default). Or maybe it does?
    // Let's assume we choose when ENTERING the era.
    // If we haven't chosen for this era yet, show modal.
    if (CIVILIZATIONS[era.name] && (!gameState.civilizationHistory || !gameState.civilizationHistory[era.name])) {
        renderCivSelection(era);
        return; // Stop advancement until chosen
    }

    // Check Paradoxes for PREVIOUS era
    const newParadoxes = checkParadoxes(gameState);
    if (newParadoxes.length > 0) {
        newParadoxes.forEach(p => alert(`⚠️ PARADOX TRIGGERED: ${p.name}\n${p.description}`));
    }

    gameState.era = era.name;
    console.log(`Advanced to ${era.name}!`);

    // Check if Space Age unlocked
    if (era.name === "Future Age" && (!gameState.space || gameState.space.planets.length === 0)) {
        gameState.space = { planets: generatePlanets(5) };
        alert("🌌 SPACE AGE UNLOCKED! New planets detected.");
        updateUI();
    }

    // Era transition effect
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0"; overlay.style.left = "0";
    overlay.style.width = "100%"; overlay.style.height = "100%";
    overlay.style.backgroundColor = "black";
    overlay.style.color = "white";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.fontSize = "40px";
    overlay.style.zIndex = "5000";
    overlay.style.opacity = "0";
    overlay.innerText = `Entering ${era.name}`;
    overlay.style.animation = "eraFade 4s ease-in-out forwards";

    document.body.appendChild(overlay);
    setTimeout(() => document.body.removeChild(overlay), 4000);
}

function renderCivSelection(era) {
    if (document.querySelector(".modal-overlay")) return; // Prevent duplicates

    const options = CIVILIZATIONS[era.name];
    if (!options) {
        // Fallback if no options defined for this era
        gameState.civilizationHistory = gameState.civilizationHistory || {};
        gameState.civilizationHistory[era.name] = { id: "default", name: "Generic", effect: {} };
        advanceEra(era);
        return;
    }

    const modal = document.createElement("div");
    modal.className = "modal-overlay";

    let html = `
        <div class="modal-content" style="max-width: 600px;">
            <h2>Choose Your Civilization</h2>
            <p>Entering the ${era.name}...</p>
            <div style="display:flex; gap:10px; justify-content: center; flex-wrap: wrap;">
    `;

    options.forEach((civ, idx) => {
        html += `
            <div class="civ-card" onclick="selectCiv('${era.name}', ${idx})" style="background: rgba(255,255,255,0.1); padding: 15px; border: 1px solid #7f8c8d; border-radius: 8px; width: 150px; cursor: pointer;">
                <div style="font-size: 40px;">${civ.icon}</div>
                <h3>${civ.name}</h3>
                <small>${civ.desc}</small>
            </div>
        `;
    });

    html += `</div></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
    window.currentCivModal = modal;
}

window.selectCiv = function(eraName, idx) {
    if (!gameState.civilizationHistory) gameState.civilizationHistory = {};
    const eraOptions = CIVILIZATIONS[eraName];
    const choice = eraOptions[idx];

    gameState.civilizationHistory[eraName] = choice;

    if (window.currentCivModal) {
        document.body.removeChild(window.currentCivModal);
        window.currentCivModal = null;
    }

    // Resume advancement
    const eraObj = ERA_DATA.find(e => e.name === eraName);
    advanceEra(eraObj);
};

function calculatePrestigeGain() {
    if (gameState.resources.lifetimeClicks < 100) return 0;
    return Math.floor(Math.log10(1 + gameState.resources.lifetimeClicks));
}

window.downloadSave = function() {
    const json = JSON.stringify(gameState, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `history-clicker-save-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

window.uploadSave = function(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = e.target.result;
            const data = JSON.parse(json);
            // Basic validation
            if (data.resources && data.buildings) {
                Object.assign(gameState, data);
                saveGame();
                location.reload();
            } else {
                alert("Invalid save file format.");
            }
        } catch (err) {
            alert("Error parsing save file: " + err.message);
        }
    };
    reader.readAsText(file);
    input.value = ''; // Reset
};

window.toggleAudio = function() {
    if (window.audioController) {
        const enabled = window.audioController.toggle();
        alert(`Audio ${enabled ? 'Enabled' : 'Disabled'}`);
    }
};

window.showStats = function() {
    if (!gameState.stats) gameState.stats = {};
    const stats = gameState.stats;
    const playTime = Math.floor((Date.now() - (gameState.startTime || Date.now())) / 1000); // Simple approximation if not tracked

    // Format
    const text = `
    📊 STATISTICS 📊
    ----------------
    Total Manual Clicks: ${stats.totalClicks || 0}
    Lifetime Production: ${Math.floor(gameState.resources.lifetimeClicks)}
    Buildings Constructed: ${stats.buildingsBought || 0}
    Technologies Researched: ${stats.techsResearched || 0}
    Expeditions Completed: ${stats.expeditionsCompleted || 0}
    Relics Uncovered: ${stats.relicsFound || 0}
    Current Era: ${gameState.era}
    `;
    alert(text);
};

window.buyPrestigeUpgrade = function(id) {
    const up = gameState.prestigeUpgrades[id];
    if (!up) return;

    // Cost scaling? Static for now based on definition
    const cost = up.cost * (up.level + 1);

    if (gameState.resources.symbolsOfEra >= cost && up.level < up.max) {
        if (window.audioController) window.audioController.playBuy();
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
            <span>🪵 ${gameState.resources.wood}</span> |
            <span>🪨 ${gameState.resources.stone}</span> |
            <span>🍞 ${gameState.resources.food}</span>
        `;
    }
    document.getElementById("res-se").innerText = gameState.resources.symbolsOfEra;

    const prestigeBtn = document.getElementById("btn-prestige");
    if (prestigeBtn) {
        const gain = calculatePrestigeGain();
        prestigeBtn.innerText = `Prestige (+${gain} 🏛️)`;
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
            const bIcon = gameState.buildings[name].icon || "";

            btn.innerText = `${bIcon} Buy ${name} (${finalCost}) - Owned: ${gameState.buildings[name].count}`;
            btn.disabled = gameState.resources.clicks < finalCost;
        }
    }

    renderQuests();
    renderInventory();
    renderExpeditions();
    renderCrafting();
    renderAchievements();
    renderWar();
    renderSpace();
    renderHeroes();
    renderGovernment();
    renderCrisis();
    renderResearchTree();
}

function renderCrisis() {
    // Overlay or Widget? Let's do a widget in the Space View if active
    if (!gameState.crisis || !gameState.crisis.active) return;

    const container = document.getElementById("crisis-widget");
    if (!container) {
        const spaceView = document.getElementById("space-view");
        if (spaceView) {
            const div = document.createElement("div");
            div.id = "crisis-widget";
            div.style.background = "#c0392b";
            div.style.padding = "15px";
            div.style.marginBottom = "20px";
            div.style.border = "2px solid #e74c3c";
            div.style.color = "white";
            spaceView.insertBefore(div, spaceView.firstChild);
        }
    }

    const widget = document.getElementById("crisis-widget");
    if (widget) {
        const threat = Math.floor(gameState.crisis.threat);
        const stage = CRISIS_STAGES.find(s => threat >= s.threshold) || CRISIS_STAGES[0]; // Logic might need reverse sort or just simple check
        // Actually threshold is lower bound. So we want largest threshold <= threat.
        const currentStage = [...CRISIS_STAGES].reverse().find(s => threat >= s.threshold) || CRISIS_STAGES[0];

        widget.innerHTML = `
            <h3>⚠️ VOID CRISIS ACTIVE ⚠️</h3>
            <p>Threat Level: ${threat}% (${currentStage.name})</p>
            <p>${currentStage.desc}</p>
            <div style="width:100%; background:#555; height:20px;">
                <div style="width:${threat}%; background:#fff; height:100%;"></div>
            </div>
            <br>
            <button onclick="launchCounterOffensive()">Launch Counter-Offensive (5k Knowl/Gold)</button>
        `;
    }
}

window.launchCounterOffensive = function() {
    const res = fightCrisis(gameState);
    alert(res);
    updateUI();
};

function renderGovernment() {
    const container = document.getElementById("government-view");
    if (!container || container.style.display === "none") return;

    // Current Gov
    const currentGov = GOVERNMENTS.find(g => g.id === gameState.government.type) || GOVERNMENTS[0];
    document.getElementById("gov-current").innerHTML = `Current: <strong>${currentGov.name}</strong><br><small>${currentGov.desc}</small>`;

    // Switch Gov
    const govList = document.getElementById("gov-list");
    govList.innerHTML = "";
    GOVERNMENTS.forEach(g => {
        if (g.id === currentGov.id) return;
        const div = document.createElement("div");
        div.className = "recipe-card"; // Reuse
        div.innerHTML = `
            <strong>${g.name}</strong> (${g.era})<br>
            <small>${g.desc}</small><br>
            <button onclick="switchGov('${g.id}')">Adopt (500 Culture)</button>
        `;
        govList.appendChild(div);
    });

    // Policies
    const polList = document.getElementById("policy-list");
    polList.innerHTML = "";
    POLICIES.forEach(p => {
        const active = gameState.government.policies.includes(p.id);
        const div = document.createElement("div");
        div.className = `expedition-card ${active ? 'active-mission' : ''}`; // Reuse

        let costText = "";
        for (let k in p.cost) costText += `${p.cost[k]} ${k} `;

        div.innerHTML = `
            <strong>${p.name}</strong><br>
            <small>${p.desc}</small><br>
            <button onclick="togglePol('${p.id}')">${active ? 'Repeal' : `Enact (${costText})`}</button>
        `;
        polList.appendChild(div);
    });
}

window.switchGov = function(id) {
    if (adoptGovernment(gameState, id)) {
        if (window.audioController) window.audioController.playEvent();
        alert("Government changed!");
        updateUI();
    } else {
        alert("Cannot adopt (Cost: 500 Culture)!");
    }
};

window.togglePol = function(id) {
    const res = togglePolicy(gameState, id);
    if (res) {
        if (window.audioController) window.audioController.playBuy();
        alert(`Policy ${res}!`);
        updateUI();
    } else {
        alert("Cannot toggle policy (Cost/Limit)!");
    }
};

function renderHeroes() {
    const container = document.getElementById("heroes-view");
    if (!container || container.style.display === "none") return;

    document.getElementById("gpp-display").innerText = `Great People Points: ${Math.floor(gameState.heroes.gpp)} / ${Math.floor(gameState.heroes.threshold)}`;

    const list = document.getElementById("hero-list");
    list.innerHTML = "";

    gameState.heroes.owned.forEach(h => {
        const div = document.createElement("div");
        div.className = "recipe-card"; // Reuse
        div.innerHTML = `
            <div style="float:left; font-size: 24px; margin-right: 10px;">${h.icon}</div>
            <strong>${h.name}</strong> (${h.title})<br>
            <small>${h.desc}</small>
        `;
        list.appendChild(div);
    });
}

window.recruitHeroBtn = function() {
    const hero = recruitHero(gameState);
    if (hero) {
        if (window.audioController) window.audioController.playEvent();
        alert(`Recruited ${hero.name}!`);
        updateUI();
    } else {
        alert("Not enough GPP or all heroes collected.");
    }
};

function renderSpace() {
    const container = document.getElementById("space-view");
    // Only show if Space is unlocked
    if (!gameState.space || gameState.space.planets.length === 0) {
        if (container) container.style.display = "none";
        // Also hide tab button if we had one (we don't yet in HTML)
        return;
    }

    // Check if we need to inject the tab button dynamically or just assume it exists
    let tabBtn = document.getElementById("tab-btn-space");
    if (!tabBtn) {
        const tabs = document.getElementById("tabs");
        if (tabs) {
            tabBtn = document.createElement("button");
            tabBtn.id = "tab-btn-space";
            tabBtn.className = "tab-btn";
            tabBtn.innerText = "Space 🚀";
            tabBtn.onclick = () => showTab('space');
            tabs.appendChild(tabBtn);

            // Also create view if missing
            if (!container) {
                const view = document.createElement("div");
                view.id = "space-view";
                view.className = "tab-view";
                view.style.display = "none";
                view.innerHTML = `<h3>Space Exploration</h3><div id="planet-list"></div>`;
                document.getElementById("tab-content").appendChild(view);
            }
        }
    }

    // Render Planets
    const list = document.getElementById("planet-list");
    if (!list) return;

    // Only render if visible to save perf
    if (document.getElementById("space-view").style.display === "none") return;

    list.innerHTML = "";
    gameState.space.planets.forEach(p => {
        const div = document.createElement("div");
        div.className = `expedition-card ${p.colonized ? 'completed' : ''}`;

        let costText = "";
        for (let k in p.cost) costText += `${p.cost[k]} ${k} `;

        div.innerHTML = `
            <div style="float:left; font-size: 32px; margin-right: 15px;">${p.icon}</div>
            <strong>${p.name}</strong> (${p.colonized ? 'Colonized' : 'Unexplored'})<br>
            <small>Resources: ${p.resources.join(", ")}</small><br>
            ${!p.colonized ? `<small>Cost: ${costText}</small><br><button onclick="attemptColonize('${p.id}')">Colonize</button>` : `<small>Producing: ${p.production.money} Gold, ${p.production.knowledge} Knowl / sec</small>`}
        `;
        list.appendChild(div);
    });
}

// Expose for testing/UI
window.renderSpace = renderSpace;
window.checkParadoxes = checkParadoxes;
window.checkCrisis = checkCrisis;
window.renderCrisis = renderCrisis;
window.checkEraProgress = checkEraProgress;

window.attemptColonize = function(planetId) {
    if (colonizePlanet(gameState, planetId)) {
        if (window.audioController) window.audioController.playEvent();
        alert("Colonization Successful!");
        updateUI();
    } else {
        alert("Not enough resources!");
    }
};

function renderWar() {
    const container = document.getElementById("war-view");
    if (!container || container.style.display === "none") return;

    const unitList = document.getElementById("unit-list");
    unitList.innerHTML = "";

    // Units
    for (let key in UNITS) {
        const u = UNITS[key];
        const owned = gameState.army ? (gameState.army[key] || 0) : 0;

        let costText = "";
        for (let res in u.cost) costText += `${u.cost[res]} ${res} `;

        const div = document.createElement("div");
        div.className = "recipe-card"; // Reuse style
        div.innerHTML = `
            <div style="float:left; font-size: 24px; margin-right: 10px;">${u.icon}</div>
            <strong>${u.name}</strong> (Atk: ${u.attack})<br>
            <small>Cost: ${costText}</small><br>
            <button onclick="trainUnit('${key}')">Train (Owned: ${owned})</button>
        `;
        unitList.appendChild(div);
    }

    // Rivals
    const rivalList = document.getElementById("rival-list");
    rivalList.innerHTML = "";

    RIVALS.forEach((rival, idx) => {
        const div = document.createElement("div");
        div.className = "expedition-card"; // Reuse style
        let lootText = "";
        for (let k in rival.loot) lootText += `${rival.loot[k]} ${k} `;

        div.innerHTML = `
            <strong>${rival.name}</strong> (Power: ~${rival.power})<br>
            <small>Loot: ${lootText}</small><br>
            <button onclick="attackRival(${idx})">Attack!</button>
        `;
        rivalList.appendChild(div);
    });

    const power = calculateArmyPower(gameState.army || {});
    document.getElementById("army-power").innerText = `Army Power: ${power}`;
}

window.trainUnit = function(unitKey) {
    if (!gameState.army) gameState.army = {};
    const unit = UNITS[unitKey];

    // Check cost
    for (let res in unit.cost) {
        if ((gameState.resources[res] || 0) < unit.cost[res]) {
            alert(`Not enough ${res}!`);
            return;
        }
    }

    // Pay
    for (let res in unit.cost) {
        gameState.resources[res] -= unit.cost[res];
    }

    if (!gameState.army[unitKey]) gameState.army[unitKey] = 0;
    gameState.army[unitKey]++;

    if (window.audioController) window.audioController.playBuy();
    updateUI();
};

window.attackRival = function(idx) {
    if (!gameState.army) gameState.army = {};
    const rival = RIVALS[idx];

    // Convert army object to format for resolveCombat if needed (current structure matches)
    // We pass gameState.army directly which is { "Warrior": 5 }
    // Note: resolveCombat modifies playerArmy in place for losses.

    // Deep copy army to avoid modifying state before we know results/apply losses?
    // Actually resolveCombat applies losses to the passed object.
    // This is fine as long as we save/updateUI after.

    const result = resolveCombat(gameState.army, rival);

    let msg = result.win ? `VICTORY against ${rival.name}!` : `DEFEAT against ${rival.name}!`;
    msg += `\nYour Power: ${result.playerPower} vs Enemy: ${result.rivalPower}`;

    if (result.losses) {
        msg += "\n\nLosses:";
        for (let k in result.losses) msg += `\n- ${result.losses[k]} ${k}`;
    }

    if (result.win && result.loot) {
        msg += "\n\nLoot:";
        for (let k in result.loot) {
            if (!gameState.resources[k]) gameState.resources[k] = 0;
            gameState.resources[k] += result.loot[k];
            msg += `\n+ ${result.loot[k]} ${k}`;
        }
    }

    alert(msg);
    updateUI();
};

// Expose
window.updateUI = updateUI;

function renderAchievements() {
    const container = document.getElementById("achievement-list");
    if (!container) return;

    // Only update if not visible? Or always?
    // Optimization: Check if currently visible or dirty.
    if (document.getElementById("achievements-view").style.display === "none") return;

    container.innerHTML = "";
    ACHIEVEMENTS.forEach(ach => {
        const unlocked = gameState.achievements.includes(ach.id);
        const div = document.createElement("div");
        div.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
        div.innerHTML = `
            <div style="float:left; font-size: 24px; margin-right: 10px;">${ach.icon}</div>
            <strong>${ach.name}</strong><br>
            <small>${ach.description}</small>
        `;
        container.appendChild(div);
    });
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
            <div style="float:left; font-size: 20px; margin-right: 8px;">${recipe.icon || '🛠️'}</div>
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
        if (window.audioController) window.audioController.playBuy();
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
        div.innerHTML = `
            <div style="float:left; font-size: 24px; margin-right: 10px;">${relic.icon || '🏺'}</div>
            <strong>${relic.name}</strong><br><small>${relic.rarity}</small>
        `;
        container.appendChild(div);
    });
}

function renderExpeditions() {
    const container = document.getElementById("expedition-list");
    if (container) {
        container.innerHTML = "";

        // Header with Reroll
        const header = document.createElement("div");
        let rerollText = "Reroll (Free)";
        if (gameState.reroll.count >= 2) rerollText = `Reroll (${gameState.reroll.cost} Knowl)`;

        header.innerHTML = `<button onclick="rerollExpeditions()" style="width:100%; margin-bottom:10px; background-color:#9b59b6;">${rerollText}</button>`;
        container.appendChild(header);

        // Hide list if expedition active (limit 1)
        if (gameState.activeExpeditions.length > 0) {
            container.innerHTML += "<p><em>Expedition in progress...</em></p>";
        } else {
            const available = allExpeditions.slice(0, 5);

            available.forEach(exp => {
                const div = document.createElement("div");
                div.className = "expedition-card";

                const hours = Math.floor(exp.duration / 3600);
                const mins = Math.floor((exp.duration % 3600) / 60);
                const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

                const riskColor = exp.risk > 50 ? "#e74c3c" : "#f1c40f";

                // Obfuscate Loot
                const minLoot = Math.floor(exp.rewards.loot.amount * 0.8);
                const maxLoot = Math.floor(exp.rewards.loot.amount * 1.2);

                div.innerHTML = `
                    <div style="float:left; font-size: 24px; margin-right: 10px;">${exp.icon || '🗺️'}</div>
                    <strong>${exp.name}</strong><br>
                    <span style="color: ${riskColor}">Risk: ${exp.risk}%</span> | Duration: ${timeStr}<br>
                    <small>Loot: ${minLoot}-${maxLoot} ${exp.rewards.loot.type}</small><br>
                    <button onclick="startExpedition('${exp.id}')">Start (Cost: ${exp.cost.food} 🍞)</button>
                `;
                container.appendChild(div);
            });
        }
    }

    // 2. Active List (Status Card)
    const activeContainer = document.getElementById("active-expedition-list");
    if (activeContainer) {
        activeContainer.innerHTML = "";
        if (gameState.activeExpeditions.length === 0) {
            activeContainer.innerHTML = "<p>No active expeditions.</p>";
        } else {
            gameState.activeExpeditions.forEach(exp => {
                const div = document.createElement("div");
                div.className = "expedition-card active-mission";
                const pct = Math.min(100, (exp.progress / exp.duration) * 100);
                div.onclick = () => alert(`Status: ${exp.name}\nProgress: ${Math.floor((exp.progress/exp.duration)*100)}%`);

                div.innerHTML = `
                    <strong>IN PROGRESS: ${exp.name}</strong><br>
                    <div class="expedition-progress-bg" style="height: 20px;">
                        <div class="expedition-progress-fill" style="width: ${pct}%"></div>
                    </div>
                    <small>Tap for details</small>
                `;
                activeContainer.appendChild(div);
            });
        }
    }
}

window.startExpedition = function(expId) {
    // Limit active
    if (gameState.activeExpeditions.length >= 1) {
        alert("Only 1 active expedition allowed!");
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

    // Risk Check
    const roll = Math.random() * 100;
    if (roll < exp.risk) {
        // Failed
        if (window.audioController) window.audioController.playError();
        const log = `Expedition '${exp.name}' FAILED! (Rolled ${Math.floor(roll)} vs Risk ${exp.risk}). All resources lost.`;
        console.log(log);
        alert(log);
        updateUI();
        return;
    }

    // Success
    if (window.audioController) window.audioController.playEvent();
    let log = `Expedition '${exp.name}' SUCCESS! `;

    // Stats
    if (!gameState.stats) gameState.stats = {};
    if (!gameState.stats.expeditionsCompleted) gameState.stats.expeditionsCompleted = 0;
    gameState.stats.expeditionsCompleted++;

    if (exp.rewards.relics > 0) {
        const relic = allRelics[Math.floor(Math.random() * allRelics.length)];
        gameState.inventory.push(relic);

        // Stats
        if (!gameState.stats.relicsFound) gameState.stats.relicsFound = 0;
        gameState.stats.relicsFound++;

        log += `Found relic: ${relic.name}. `;
    }

    if (exp.rewards.money > 0) {
        gameState.resources.money += exp.rewards.money;
        log += `Gained ${exp.rewards.money} Gold. `;
    }

    if (exp.rewards.loot) {
        const type = exp.rewards.loot.type;
        let amount = exp.rewards.loot.amount;

        // Paradox Check
        const pMult = getParadoxMultiplier(gameState, "production_mult", type);
        amount = Math.floor(amount * pMult);

        if (gameState.resources[type] !== undefined) {
            gameState.resources[type] += amount;

            // Track History
            if (!gameState.stats.history) gameState.stats.history = {};
            if (!gameState.stats.history[gameState.era]) gameState.stats.history[gameState.era] = {};

            if (type === "wood") {
                if (!gameState.stats.history[gameState.era].woodGathered) gameState.stats.history[gameState.era].woodGathered = 0;
                gameState.stats.history[gameState.era].woodGathered += amount;
            }

            log += `Gained ${amount} ${type}. `;
        }
    }

    console.log(log);
    alert(log);
    updateUI();
}

window.rerollExpeditions = function() {
    // Check cost
    let cost = 0;
    if (gameState.reroll.count >= 2) {
        cost = gameState.reroll.cost;
        if (gameState.resources.knowledge < cost) {
            alert(`Not enough Knowledge! Need ${cost}.`);
            return;
        }
    }

    // Pay
    if (cost > 0) {
        gameState.resources.knowledge -= cost;
        gameState.reroll.cost *= 2; // Double cost
    }

    gameState.reroll.count++;
    allExpeditions = generateExpeditions(); // Refresh
    updateUI();
};

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
    let maxX = 0;
    let maxY = 0;

    let colIdx = 0;
    for (const era of ERA_DATA) {
        const techs = columns[era.name] || [];
        techs.forEach((tech, rowIdx) => {
            const x = 50 + colIdx * ERA_WIDTH;
            const y = 50 + rowIdx * (NODE_HEIGHT + 20);

            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;

            positions[tech.id] = {x, y};

            const reqMet = tech.requirements.every(req => gameState.researched.includes(req));
            const isDone = gameState.researched.includes(tech.id);
            const isAvailable = reqMet;
            const isVisible = isDone || isAvailable || tech.requirements.some(r => gameState.researched.includes(r));

            if (isVisible) {
                const div = document.createElement("div");
                div.className = `tech-node ${isDone ? 'researched' : (isAvailable ? 'available' : 'locked')}`;
                div.innerHTML = `<span style="font-size:16px">${tech.icon || '🔬'}</span><br>${tech.name}<br><small>(${tech.cost})</small>`;
                div.style.left = `${x}px`;
                div.style.top = `${y}px`;
                div.onclick = () => window.buyResearch(tech.id);
                container.appendChild(div);
            }
        });
        colIdx++;
    }

    // Resize SVG to fit content
    svg.style.width = Math.max(container.clientWidth, maxX + 200) + "px";
    svg.style.height = Math.max(container.clientHeight, maxY + 200) + "px";

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
