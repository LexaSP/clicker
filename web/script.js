// script.js
import { generateRelics, generateResearch, generateIdeas, generateExpeditions, generateRecipes } from './content-gen.js';
import { AudioController } from './audio.js';
import { ACHIEVEMENTS, checkAchievements } from './achievements.js';
import { RANDOM_EVENTS } from './events.js';
import { PARADOXES, checkParadoxes, getParadoxMultiplier } from './paradox.js';
import { UNITS, RIVALS, calculateArmyPower, resolveCombat, TACTICS } from './combat.js';
import { generatePlanets, colonizePlanet, getSpaceProduction, terraformPlanet } from './space.js';
import { generateGPP, recruitHero, getHeroMultiplier } from './heroes.js';
import { GOVERNMENTS, POLICIES, adoptGovernment, togglePolicy, getGovernmentMultiplier } from './government.js';
import { checkCrisis, fightCrisis, CRISIS_STAGES } from './crisis.js';
import { CIVILIZATIONS, getCivMultiplier } from './civilizations.js';
import { WONDERS, getWonderMultiplier, buildWonder } from './wonders.js';
import { CHALLENGES, getChallengeRewardMult, checkChallengeVictory, getWeeklyChallenge } from './challenges.js';
import { GOVERNORS, hireGovernor, processAutomation, toggleGovernor } from './automation.js';
import { TRADE_RATES, tradeResource } from './trade.js';
import { MapEngine } from './map_engine.js';
import { ASCENSION_TREE, buyAscensionPerk, getAscensionMultiplier } from './ascension.js';
import { MINISTERS, updateMinisters, getMinistryMultiplier } from './ministries.js';
import { CAMPAIGN_CHAPTERS, checkCampaignProgress, completeChapter } from './campaign.js';
import { getDiplomacyState, interactDiplomacy, updateDiplomacy } from './diplomacy.js';
import { getReligionState, foundReligion, adoptDogma, updateReligion } from './religion.js';
import { getDynastyMultiplier, updateDynasty, succession } from './dynasty.js';
import { initEspionage, trainSpy, startMission, updateEspionage, SPY_MISSIONS } from './espionage.js';
import { initStockMarket, updateStockMarket, buyStock, sellStock, COMPANIES } from './stock_market.js';
import { initCongress, updateCongress, vote, getCongressMultiplier, RESOLUTIONS } from './congress.js';
import { renderLeaderboardModal, checkLeaderboardRewards, submitScore } from './leaderboard.js';
import { initMuseum, getMuseumMultiplier, renderMuseum } from './museum.js';
import { renderModdingMenu } from './modding.js';

// Expose to window for HTML onClick
window.renderLeaderboardModal = renderLeaderboardModal;
window.renderModdingMenu = renderModdingMenu;
import { initConstellations, getConstellationMultiplier, renderConstellationMenu } from './constellations.js';
import { checkTutorials, initTutorials } from './tutorial.js';

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
        food: 0,
        iron: 0,
        steel: 0,
        oil: 0,
        uranium: 0,
        energy: 0
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
    governors: [], // Hired governors
    wonders: [], // Built wonders IDs
    activeChallenge: null, // ID of current challenge
    completedChallenges: [], // List of completed IDs
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

    ascensionPerks: [], // Unlocked Tree Perks
    ministries: {}, // { defense: { level: 1, xp: 0 } }
    campaign: { completed: [] }, // Story progress

    // Upgrades / Buildings (Expanded 3x Scale)
    buildings: {
        // Ancient
        "AutoClicker": { count: 0, cost: 10, baseCost: 10, production: 1, icon: "👆", era: "Stone Age", priceRatio: 1.07, upkeep: {}, efficiency: 1 },
        "Gatherer": { count: 0, cost: 25, baseCost: 25, production: 2, icon: "🧺", era: "Stone Age", priceRatio: 1.07, upkeep: {}, efficiency: 1 },
        "Farm": { count: 0, cost: 50, baseCost: 50, production: 5, icon: "🌾", era: "Bronze Age", priceRatio: 1.07, upkeep: {}, efficiency: 1 },
        "Mine": { count: 0, cost: 200, baseCost: 200, production: 20, icon: "⛏️", era: "Bronze Age", priceRatio: 1.12, upkeep: {}, efficiency: 1 },
        "Workshop": { count: 0, cost: 500, baseCost: 500, production: 50, icon: "🔨", era: "Iron Age", priceRatio: 1.12, upkeep: {}, efficiency: 1 },

        // Classical/Medieval
        "Aqueduct": { count: 0, cost: 1500, baseCost: 1500, production: 80, icon: "💧", era: "Iron Age", priceRatio: 1.12, upkeep: {}, efficiency: 1 },
        "University": { count: 0, cost: 5000, baseCost: 5000, production: 200, icon: "🎓", era: "Middle Ages", priceRatio: 1.12, upkeep: {}, efficiency: 1 }, // Knowledge
        "Bank": { count: 0, cost: 10000, baseCost: 10000, production: 500, icon: "🏦", era: "Renaissance", priceRatio: 1.12, upkeep: {}, efficiency: 1 }, // Money

        // Industrial/Modern
        "Factory": { count: 0, cost: 25000, baseCost: 25000, production: 1500, icon: "🏭", era: "Industrial Age", priceRatio: 1.12, upkeep: { iron: 1, energy: 5 }, efficiency: 1 },
        "Lab": { count: 0, cost: 50000, baseCost: 50000, production: 3000, icon: "🔬", era: "Modern Age", priceRatio: 1.25, upkeep: {}, efficiency: 1 }, // Knowledge
        "PowerPlant": { count: 0, cost: 150000, baseCost: 150000, production: 10000, icon: "⚡", era: "Modern Age", priceRatio: 1.25, upkeep: {}, efficiency: 1 },

        // Future
        "Supercomputer": { count: 0, cost: 1000000, baseCost: 1000000, production: 50000, icon: "🖥️", era: "Information Age", priceRatio: 1.25, upkeep: {}, efficiency: 1 },
        "FusionReactor": { count: 0, cost: 5000000, baseCost: 5000000, production: 250000, icon: "⚛️", era: "Future Age", priceRatio: 1.25, upkeep: {}, efficiency: 1 }
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
    { name: "Bronze Age", threshold: 2000, className: "era-bronze" },
    { name: "Iron Age", threshold: 10000, className: "era-iron" },
    { name: "Middle Ages", threshold: 50000, className: "era-middle" },
    { name: "Renaissance", threshold: 250000, className: "era-renaissance" },
    { name: "Industrial Age", threshold: 1000000, className: "era-industrial" },
    { name: "Modern Age", threshold: 10000000, className: "era-modern" },
    { name: "Information Age", threshold: 50000000, className: "era-info" },
    { name: "Future Age", threshold: 250000000, className: "era-future" }
];

// --- Unlocks Config ---
const FEATURE_UNLOCKS = {
    // Static Tabs (IDs in index.html)
    "tab-btn-expeditions": { era: "Bronze Age" },
    "tab-btn-war": { era: "Bronze Age" },
    "tab-btn-government": { era: "Bronze Age" },
    "tab-btn-crafting": { era: "Iron Age" },
    "tab-btn-heroes": { era: "Middle Ages" },

    // Dynamic Tabs
    "tab-btn-trade": { era: "Iron Age" }, // Market
    "tab-btn-wonders": { era: "Iron Age" },
    "tab-btn-religion": { era: "Middle Ages" },
    "tab-btn-diplomacy": { era: "Renaissance" },
    "tab-btn-espionage": { era: "Renaissance" }, // Sub-feature, handled by Diplo tab? No, separate logic if wanted, but here assumes Diplomacy
    "tab-btn-governors": { era: "Industrial Age" },
    "tab-btn-cabinet": { era: "Modern Age" },
    "tab-btn-congress": { era: "Modern Age" }, // Sub-feature
    "tab-btn-space": { era: "Future Age" },
    "tab-btn-leaderboard": { era: "Bronze Age" }, // Minimal progression
    "tab-btn-mods": { era: "Future Age" } // Or NG+ handled internally
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
    checkFeatureUnlocks(); // Initial check
    initTutorials(gameState);

    // Init Audio
    window.audioController = new AudioController();

    // Init Visuals (Map Engine)
    window.mapEngine = new MapEngine();

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

function calculateProduction(state) {
    let production = 0;
    // Iterate dynamically over ALL buildings that produce generic 'production' (clicks)
    // We assume most buildings produce "production" unless specified otherwise (like Lab/Bank)

    const clickProducers = ["AutoClicker", "Gatherer", "Farm", "Mine", "Workshop", "Aqueduct", "Factory", "PowerPlant", "FusionReactor"];

    clickProducers.forEach(key => {
        if (state.buildings[key]) {
            const eff = state.buildings[key].efficiency !== undefined ? state.buildings[key].efficiency : 1;
            production += state.buildings[key].count * state.buildings[key].production * eff;
        }
    });

    // Apply Multipliers
    let prodMult = getGlobalMultiplier("production", "clicks");
    if (state.tempMultiplier) prodMult *= state.tempMultiplier;

    return production * prodMult;
}

function tick(dt) {
    // Era Progress
    checkEraProgress();

    // --- CONSUMPTION & UPKEEP ---
    let totalUpkeep = {};
    for (let key in gameState.buildings) {
        const b = gameState.buildings[key];
        if (b.count > 0 && b.upkeep) {
            for (let res in b.upkeep) {
                if (!totalUpkeep[res]) totalUpkeep[res] = 0;
                totalUpkeep[res] += b.upkeep[res] * b.count;
            }
        }
    }

    let resourceEfficiency = {}; // resource -> 0..1
    for (let res in totalUpkeep) {
        const needed = totalUpkeep[res] * dt;
        if (gameState.resources[res] >= needed) {
            gameState.resources[res] -= needed;
            resourceEfficiency[res] = 1.0;
        } else {
            const available = gameState.resources[res];
            if (available > 0) {
                 gameState.resources[res] = 0;
                 resourceEfficiency[res] = available / needed;
            } else {
                 resourceEfficiency[res] = 0;
            }
        }
    }

    // Apply Efficiency
    for (let key in gameState.buildings) {
        const b = gameState.buildings[key];
        b.efficiency = 1.0;
        if (b.upkeep) {
            for (let res in b.upkeep) {
                if (resourceEfficiency[res] !== undefined) {
                    b.efficiency = Math.min(b.efficiency, resourceEfficiency[res]);
                }
            }
        }
    }

    // Production
    const currentProduction = calculateProduction(gameState);
    gameState.netProduction = currentProduction; // For UI

    // Knowledge (Lab + University + Supercomputer)
    let knowledgeProd = 0;
    if (gameState.buildings["University"]) {
         const eff = gameState.buildings["University"].efficiency !== undefined ? gameState.buildings["University"].efficiency : 1;
         knowledgeProd += gameState.buildings["University"].count * gameState.buildings["University"].production * eff;
    }
    if (gameState.buildings["Lab"]) {
         const eff = gameState.buildings["Lab"].efficiency !== undefined ? gameState.buildings["Lab"].efficiency : 1;
         knowledgeProd += gameState.buildings["Lab"].count * gameState.buildings["Lab"].production * eff;
    }
    if (gameState.buildings["Supercomputer"]) {
         const eff = gameState.buildings["Supercomputer"].efficiency !== undefined ? gameState.buildings["Supercomputer"].efficiency : 1;
         knowledgeProd += gameState.buildings["Supercomputer"].count * gameState.buildings["Supercomputer"].production * eff;
    }

    knowledgeProd *= getGlobalMultiplier("production_mult", "knowledge");

    // Money (Bank)
    let moneyProd = 0;
    if (gameState.buildings["Bank"]) {
        const eff = gameState.buildings["Bank"].efficiency !== undefined ? gameState.buildings["Bank"].efficiency : 1;
        moneyProd += gameState.buildings["Bank"].count * gameState.buildings["Bank"].production * eff;
    }
    moneyProd *= getGlobalMultiplier("production_mult", "money");

    // Space Production
    const spaceProd = getSpaceProduction(gameState);
    const moneyMult = getGlobalMultiplier("production_mult", "money");
    const knowlMult = getGlobalMultiplier("production_mult", "knowledge");

    gameState.resources.money += spaceProd.money * moneyMult * dt; // Space part
    gameState.resources.money += moneyProd * dt; // Bank part (already multiplied)

    gameState.resources.knowledge += spaceProd.knowledge * knowlMult * dt;

    // GPP
    generateGPP(gameState, dt);

    // Automation
    processAutomation(gameState, dt, window.manualClick, window.buyBuilding);

    // Ministry XP
    updateMinisters(gameState, dt);

    // Diplomacy & Religion
    updateDiplomacy(gameState, dt);
    updateReligion(gameState, dt);

    // Dynasty
    updateDynasty(gameState, dt);

    // Espionage
    updateEspionage(gameState);

    // Stock Market
    updateStockMarket(gameState, dt);

    // World Congress
    updateCongress(gameState, dt);

    // Crisis
    checkCrisis(gameState, dt);

    // Challenge Victory Check
    const victory = checkChallengeVictory(gameState);
    if (victory) {
        completeChallenge(victory);
    }

    // Campaign Progress
    const chapter = checkCampaignProgress(gameState);
    if (chapter) {
        if (completeChapter(gameState, chapter)) {
            alert(`📜 CHAPTER COMPLETE: ${chapter.title}\n\n${chapter.lore}\n\nReward: ${chapter.reward.text}`);
            updateUI();
        }
    }

    gameState.resources.clicks += currentProduction * dt;
    gameState.resources.lifetimeClicks += currentProduction * dt;
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

    // Leaderboard Rewards
    checkLeaderboardRewards(gameState);

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
function getGlobalMultiplier(type, resource = null) {
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
    mult *= getParadoxMultiplier(gameState, type, resource);

    // Hero Check
    mult *= getHeroMultiplier(gameState, type, resource);

    // Government Check
    mult *= getGovernmentMultiplier(gameState, type, resource);

    // Civilizations Check
    mult *= getCivMultiplier(gameState, type, resource);

    // Wonders Check
    mult *= getWonderMultiplier(gameState, type, resource);

    // Challenges Check
    mult *= getChallengeRewardMult(gameState, type);

    // Ascension Tree Check
    // Map internal types to ascension effects
    if (type === "production") {
        // "perm_mult" with target "production" (not currently in tree, but extensible)
    }
    if (type === "click") {
        mult *= getAscensionMultiplier(gameState, "perm_mult", "click");
    }

    // Ministry Check
    mult *= getMinistryMultiplier(gameState, type, resource);

    // Dynasty Check
    mult *= getDynastyMultiplier(gameState, type);

    // Congress Check
    mult *= getCongressMultiplier(gameState, type);

    // Museum Check
    mult *= getMuseumMultiplier(gameState, type);

    // Constellation Check
    mult *= getConstellationMultiplier(gameState, type);

    if (type === "cost") {
        // resource arg maps to target (building, tech, wonder)
        const target = resource === "knowledge" ? "tech" : (resource === "wonder" ? "wonder" : "building");
        const reduction = getAscensionMultiplier(gameState, "cost_reduction", target);
        // Reduction is raw sum (e.g. 20 for 20%)
        mult -= (reduction / 100);
    }

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
    // Challenge Constraint: No Manual Clicks
    if (gameState.activeChallenge === "lazy_leader") return;

    if (window.audioController) window.audioController.playClick();

    // Base Click Value + Synergy (10% of CpS)
    const cps = calculateProduction(gameState);

    // Track Max Production for Leaderboard
    if (!gameState.stats.maxProduction || cps > gameState.stats.maxProduction) {
        gameState.stats.maxProduction = cps;
    }

    let clickValue = 1 + (gameState.inventory.length * 0.1) + (cps * 0.1);

    clickValue *= getGlobalMultiplier("click", "clicks");

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
    p.style.textShadow = "0 0 5px black";
    p.style.zIndex = "100";
    document.body.appendChild(p);

    setTimeout(() => {
        if (document.body.contains(p)) document.body.removeChild(p);
    }, 1000);
}

window.buyBuilding = function(name) {
    // Challenge Constraint: Max 1 Building
    if (gameState.activeChallenge === "one_city") {
        if (gameState.buildings[name] && gameState.buildings[name].count >= 1) {
            alert("Challenge Constraint: Cannot own more than 1 of each building!");
            return;
        }
    }

    const b = gameState.buildings[name];
    if (!b) return;

    // Apply Cost Reduction
    let costMult = getGlobalMultiplier("cost", null);

    // Use current cost from state
    let nominalCost = b.cost;
    let finalCost = Math.floor(nominalCost * costMult);

    if (gameState.resources.clicks >= finalCost) {
        if (window.audioController) window.audioController.playBuy();
        gameState.resources.clicks -= finalCost;
        b.count++;

        // Stats
        if (!gameState.stats) gameState.stats = {};
        if (!gameState.stats.buildingsBought) gameState.stats.buildingsBought = 0;
        gameState.stats.buildingsBought++;

        // Update Cost for Next Purchase (Formula)
        b.cost = Math.floor(b.baseCost * Math.pow(b.priceRatio, b.count));

        // Visuals
        if (window.mapEngine && b.icon) {
            window.mapEngine.addBuilding(name, b.icon);
        }

        checkQuestProgress("purchases", 1);
        updateUI();
    }
};

window.buyResearch = function(techId) {
    // Challenge Constraint: No Research
    if (gameState.activeChallenge === "austere") {
        alert("Challenge Constraint: Research is disabled!");
        return;
    }

    const tech = allResearch.find(t => t.id === techId);
    if (!tech) return;

    let costMult = getGlobalMultiplier("cost", "knowledge"); // Tech cost is usually knowledge
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
    // Note: We use current production for offline calc.
    const currentProduction = calculateProduction(gameState);

    // Ascension Boost
    const offMult = getAscensionMultiplier(gameState, "offline_boost", null);

    const clicksGained = Math.floor(currentProduction * seconds * 0.5 * offMult);

    if (clicksGained > 0) {
        gameState.resources.clicks += clicksGained;
        gameState.resources.lifetimeClicks += clicksGained;
        alert(`Welcome back! You were gone for ${Math.floor(seconds)} seconds.\nOffline Production: +${clicksGained} Clicks (50% efficiency).`);
    }
}

// --- UI Updates ---
function initUI() {
    renderResearchTree();
    injectDynamicTabs();
}

function injectDynamicTabs() {
    const tabs = document.getElementById("tabs");
    const content = document.getElementById("tab-content");

    if (!tabs || !content) return;

    // Helper
    const createTab = (id, label, viewId, viewHtml) => {
        if (!document.getElementById(id)) {
            const btn = document.createElement("button");
            btn.id = id;
            btn.className = "tab-btn";
            btn.innerText = label;
            btn.onclick = () => showTab(viewId.replace("-view", ""));
            btn.style.display = "none"; // Hidden by default
            tabs.appendChild(btn);

            const view = document.createElement("div");
            view.id = viewId;
            view.className = "tab-view";
            view.style.display = "none";
            view.innerHTML = viewHtml;
            content.appendChild(view);
        }
    };

    // Helper for help buttons
    const helpBtn = (topic) => `<button class="help-btn" onclick="showHelp('${topic}')">?</button>`;

    createTab("tab-btn-trade", "Market ⚖️", "trade-view", `<h3>Global Market ${helpBtn('market')}</h3><p>Trade resources for Money.</p><div id="trade-list"></div><hr><h3>Stock Exchange</h3><div id="stock-list"></div>`);
    createTab("tab-btn-wonders", "Wonders 🏛️", "wonders-view", `<h3>Great Wonders ${helpBtn('wonders')}</h3><p>Build monumental structures for massive global bonuses.</p><div id="wonder-list"></div>`);
    createTab("tab-btn-governors", "Governors 👔", "governors-view", `<h3>Governors & Managers ${helpBtn('governors')}</h3><p>Automate your empire.</p><div id="governor-list"></div>`);
    createTab("tab-btn-cabinet", "Cabinet 🏛️", "cabinet-view", `<h3>Imperial Cabinet ${helpBtn('dynasty')}</h3><p>Ministers gain experience over time.</p><div id="minister-list"></div>`);
    createTab("tab-btn-diplomacy", "Diplomacy 🤝", "diplomacy-view", `<h3>Foreign Relations ${helpBtn('diplomacy')}</h3><div id="diplomacy-list"></div><hr><h3>Espionage Agency</h3><div id="espionage-list"></div><hr><h3>World Congress 🌐</h3><div id="congress-list"></div>`);
    createTab("tab-btn-religion", "Religion 🛐", "religion-view", `<h3>Faith & Dogmas ${helpBtn('religion')}</h3><div id="religion-ui"></div><hr><h3>Museum 🎨</h3><div id="museum-list"></div>`);

    // Campaign Widget (Top of content?)
    // We can inject it into main-area or a specific tab. Let's put it in main area for visibility?
    // Or just a button. Let's add a "Story" button to the sidebar.
    let storyBtn = document.getElementById("btn-story");
    if (!storyBtn) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            storyBtn = document.createElement("button");
            storyBtn.id = "btn-story";
            storyBtn.innerText = "📜 Story";
            storyBtn.onclick = () => renderCampaignModal();
            storyBtn.style.width = "100%";
            storyBtn.style.padding = "10px";
            storyBtn.style.marginBottom = "10px";
            storyBtn.style.background = "#e67e22";
            storyBtn.style.color = "white";
            storyBtn.style.border = "none";
            storyBtn.style.cursor = "pointer";

            sidebar.prepend(storyBtn); // Put at top
        }
    }
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

function checkFeatureUnlocks() {
    const currentEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);

    for (let id in FEATURE_UNLOCKS) {
        const req = FEATURE_UNLOCKS[id];
        const reqEraIdx = ERA_DATA.findIndex(e => e.name === req.era);

        const el = document.getElementById(id);
        if (el) {
            if (currentEraIdx >= reqEraIdx) {
                if (el.style.display === "none") {
                    el.style.display = "inline-block";
                    // Alert or toast? Maybe too spammy.
                }
            } else {
                el.style.display = "none";
            }
        }
    }

    // Mods button in UI
    const modBtn = document.querySelector("button[onclick*='renderModdingMenu']");
    if (modBtn) {
        // Only show if NG+
        if (gameState.stats.transcendenceCount && gameState.stats.transcendenceCount > 0) {
            modBtn.style.display = "inline-block";
        } else {
            modBtn.style.display = "none";
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
    if (window.mapEngine) window.mapEngine.setEra(era.name);
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
        // Build Pros/Cons HTML
        let prosHtml = "";
        if (civ.pros) civ.pros.forEach(p => prosHtml += `<div style='color:#2ecc71; font-size:10px;'>+ ${p}</div>`);

        let consHtml = "";
        if (civ.cons) civ.cons.forEach(c => consHtml += `<div style='color:#e74c3c; font-size:10px;'>- ${c}</div>`);

        html += `
            <div class="civ-card" onclick="selectCiv('${era.name}', ${idx})" style="background: rgba(255,255,255,0.1); padding: 15px; border: 1px solid #7f8c8d; border-radius: 8px; width: 180px; cursor: pointer;">
                <div style="font-size: 40px;">${civ.icon}</div>
                <h3>${civ.name}</h3>
                <div style="text-align:left; margin-top:5px;">
                    ${prosHtml}
                    ${consHtml}
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
    window.currentCivModal = modal;
}

// Expose for testing
window.renderCivSelection = renderCivSelection;

window.selectCiv = function(eraName, idx) {
    if (!gameState.civilizationHistory) gameState.civilizationHistory = {};
    const eraOptions = CIVILIZATIONS[eraName];
    const choice = eraOptions[idx];

    gameState.civilizationHistory[eraName] = choice;

    // Grant Unique Reward
    if (choice.unique_reward) {
        const reward = choice.unique_reward;
        let msg = `You chose ${choice.name}!\n\nUnique Perk Acquired: ${reward.name}\n`;

        if (reward.type === "relic") {
            // Add as a special relic
            gameState.inventory.push({
                id: `unique_${choice.id}_${Date.now()}`,
                name: reward.name,
                icon: reward.icon || "🌟",
                rarity: "Unique",
                description: reward.desc,
                effect: reward.effect
            });
            msg += `Relic Added: ${reward.desc}`;
        } else if (reward.type === "building") {
            const bKey = reward.name;
            if (gameState.buildings[bKey]) {
                gameState.buildings[bKey].count += reward.count;
                // Update cost for next one to reflect "free" ones?
                // Usually free buildings don't increase cost of next purchase, OR they do.
                // Let's assume they act as if purchased for scaling to prevent exploit,
                // OR better, just free bonus. Let's keep cost separate in current simple logic.
                // But wait, our buy logic uses count to calc cost. So this will increase cost.
                // That's fair for balance.
                msg += `+${reward.count} ${bKey}`;
            }
        } else if (reward.type === "resource") {
            if (gameState.resources[reward.resource] !== undefined) {
                gameState.resources[reward.resource] += reward.amount;
                msg += `+${reward.amount} ${reward.resource}`;
            }
        }

        alert(msg);
    }

    if (window.currentCivModal) {
        document.body.removeChild(window.currentCivModal);
        window.currentCivModal = null;
    }

    // Resume advancement
    const eraObj = ERA_DATA.find(e => e.name === eraName);
    advanceEra(eraObj);
    updateUI();
};

function calculatePrestigeGain() {
    if (gameState.resources.lifetimeClicks < 100000) return 0;
    // New Formula: (Lifetime / 1M)^0.5
    // 1M -> 1 SE, 4M -> 2 SE, 100M -> 10 SE, 10B -> 100 SE
    let gain = Math.floor(Math.pow(gameState.resources.lifetimeClicks / 1000000, 0.5));

    // Ascension Boost
    const pMult = getAscensionMultiplier(gameState, "prestige_gain", null);
    gain = Math.floor(gain * pMult);

    return gain;
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

window.exportSaveString = function() {
    const json = JSON.stringify(gameState);
    const b64 = btoa(json);
    prompt("Copy this save string:", b64);
};

window.importSaveString = function() {
    const b64 = prompt("Paste save string:");
    if (!b64) return;
    try {
        const json = atob(b64);
        const data = JSON.parse(json);
        if (data.resources && data.buildings) {
            Object.assign(gameState, data);
            saveGame();
            location.reload();
        } else {
            alert("Invalid save string.");
        }
    } catch (e) {
        alert("Error importing save: " + e.message);
    }
};

window.toggleAudio = function() {
    if (window.audioController) {
        const enabled = window.audioController.toggle();
        alert(`Audio ${enabled ? 'Enabled' : 'Disabled'}`);
    }
};

window.toggleAccessibility = function() {
    document.body.classList.toggle("accessibility-mode");
    const mode = document.body.classList.contains("accessibility-mode");
    alert(`Accessibility Mode: ${mode ? 'ON' : 'OFF'}`);
    gameState.settings = gameState.settings || {};
    gameState.settings.accessibility = mode;
    saveGame();
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

window.performPrestige = function(challengeId = null) {
    const gain = calculatePrestigeGain();
    if (gain <= 0 && !challengeId) {
        alert("Not enough progress to prestige!");
        return;
    }

    let confirmMsg = `Reset game to gain ${gain} Symbols of Era?`;
    if (challengeId) confirmMsg = `Reset run and start CHALLENGE: ${challengeId}?`;

    if (!confirm(confirmMsg)) return;

    const symbols = gameState.resources.symbolsOfEra + gain;
    const inventory = gameState.inventory;
    const shards = gameState.resources.relicShards;
    const lifetime = gameState.resources.lifetimeClicks;
    const completedChallenges = gameState.completedChallenges || [];
    const ascensionPerks = gameState.ascensionPerks || []; // Keep perks

    // Reset State
    gameState.resources.clicks = 0;
    gameState.resources.money = 0;
    gameState.resources.knowledge = 0;
    gameState.resources.lifetimeClicks = 0; // Fix infinite exploit

    gameState.civilizationHistory = {}; // Reset civ choices
    gameState.activeResearch = [];
    gameState.researched = [];
    gameState.activeExpeditions = [];
    gameState.wonders = []; // Reset wonders

    // Reset Buildings & Costs
    // We need to restore base values. Since we don't have a separate config,
    // we'll re-initialize specific buildings manually or use a helper.
    // Hard-resetting to known base values:
    gameState.buildings = {
        "AutoClicker": { count: 0, cost: 10, baseCost: 10, production: 1, icon: "👆", era: "Stone Age", priceRatio: 1.07, upkeep: {}, efficiency: 1 },
        "Gatherer": { count: 0, cost: 25, baseCost: 25, production: 2, icon: "🧺", era: "Stone Age", priceRatio: 1.07, upkeep: {}, efficiency: 1 },
        "Farm": { count: 0, cost: 50, baseCost: 50, production: 5, icon: "🌾", era: "Bronze Age", priceRatio: 1.07, upkeep: {}, efficiency: 1 },
        "Mine": { count: 0, cost: 200, baseCost: 200, production: 20, icon: "⛏️", era: "Bronze Age", priceRatio: 1.12, upkeep: {}, efficiency: 1 },
        "Workshop": { count: 0, cost: 500, baseCost: 500, production: 50, icon: "🔨", era: "Iron Age", priceRatio: 1.12, upkeep: {}, efficiency: 1 },
        "Aqueduct": { count: 0, cost: 1500, baseCost: 1500, production: 80, icon: "💧", era: "Iron Age", priceRatio: 1.12, upkeep: {}, efficiency: 1 },
        "University": { count: 0, cost: 5000, baseCost: 5000, production: 200, icon: "🎓", era: "Middle Ages", priceRatio: 1.12, upkeep: {}, efficiency: 1 },
        "Bank": { count: 0, cost: 10000, baseCost: 10000, production: 500, icon: "🏦", era: "Renaissance", priceRatio: 1.12, upkeep: {}, efficiency: 1 },
        "Factory": { count: 0, cost: 25000, baseCost: 25000, production: 1500, icon: "🏭", era: "Industrial Age", priceRatio: 1.12, upkeep: { iron: 1, energy: 5 }, efficiency: 1 },
        "Lab": { count: 0, cost: 50000, baseCost: 50000, production: 3000, icon: "🔬", era: "Modern Age", priceRatio: 1.25, upkeep: {}, efficiency: 1 },
        "PowerPlant": { count: 0, cost: 150000, baseCost: 150000, production: 10000, icon: "⚡", era: "Modern Age", priceRatio: 1.25, upkeep: {}, efficiency: 1 },
        "Supercomputer": { count: 0, cost: 1000000, baseCost: 1000000, production: 50000, icon: "🖥️", era: "Information Age", priceRatio: 1.25, upkeep: {}, efficiency: 1 },
        "FusionReactor": { count: 0, cost: 5000000, baseCost: 5000000, production: 250000, icon: "⚛️", era: "Future Age", priceRatio: 1.25, upkeep: {}, efficiency: 1 }
    };

    // Apply Ascension Start Bonuses
    ASCENSION_TREE.forEach(perk => {
        if (ascensionPerks.includes(perk.id) && perk.effect.type.startsWith("start_")) {
            if (perk.effect.type === "start_resource") {
                gameState.resources[perk.effect.resource] = (gameState.resources[perk.effect.resource] || 0) + perk.effect.value;
            }
            // Add unit start logic if needed
        }
    });
    gameState.resources.symbolsOfEra = symbols;
    gameState.resources.relicShards = shards;
    gameState.activeChallenge = challengeId; // Set new challenge
    gameState.completedChallenges = completedChallenges;

    gameState.era = "Stone Age";
    if (window.mapEngine) window.mapEngine.setEra("Stone Age");

    saveGame();
    updateUI();
    console.log("Prestige performed!");
};

function completeChallenge(chal) {
    alert(`🎉 CHALLENGE COMPLETED: ${chal.name}!\nReward: ${chal.reward.desc}`);
    if (!gameState.completedChallenges) gameState.completedChallenges = [];
    if (!gameState.completedChallenges.includes(chal.id)) {
        gameState.completedChallenges.push(chal.id);
    }
    gameState.activeChallenge = null; // Clear active
    // Maybe trigger prestige automatically or let them continue?
    // Let them continue to enjoy the reward or prestige manually.
    saveGame();
}

window.renderChallengeMenu = function() {
    if (document.getElementById("challenge-modal")) return;

    const modal = document.createElement("div");
    modal.id = "challenge-modal";
    modal.className = "modal-overlay";

    // Mix Weekly
    const weekly = getWeeklyChallenge();
    const allChallenges = [weekly, ...CHALLENGES];

    let html = `
        <div class="modal-content">
            <h2>Challenge Modes</h2>
            <p>Start a new run with special rules. Completing challenges unlocks permanent bonuses.</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
    `;

    allChallenges.forEach(c => {
        const completed = gameState.completedChallenges && gameState.completedChallenges.includes(c.id);
        const active = gameState.activeChallenge === c.id;
        const isWeekly = c.id.startsWith("weekly");

        html += `
            <div style="border: ${isWeekly ? '2px solid #8e44ad' : '1px solid #7f8c8d'}; padding: 10px; background: ${active ? '#2980b9' : (completed ? '#27ae60' : 'rgba(0,0,0,0.2)')}; text-align:left;">
                <div style="display:flex; justify-content:space-between;">
                    <strong>${c.name}</strong>
                    <span>${completed ? '✅ Completed' : (active ? '🔄 Active' : '')}</span>
                </div>
                <small>${c.description}</small><br>
                <small style="color:#e74c3c">Condition: ${c.conditionDesc}</small><br>
                <small style="color:#f1c40f">Reward: ${c.reward.desc}</small><br>
                ${!active ? `<button onclick="startChallenge('${c.id}')" style="margin-top:5px; width:auto; padding:5px 10px;">Start Challenge (Resets Game)</button>` : ''}
            </div>
        `;
    });

    html += `<button onclick="document.body.removeChild(document.getElementById('challenge-modal'))" style="background:#c0392b; margin-top:20px;">Close</button></div></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

window.startChallenge = function(id) {
    if (confirm("Starting a challenge will RESET your current run (Prestige). Are you sure?")) {
        // Remove modal
        const m = document.getElementById("challenge-modal");
        if (m) document.body.removeChild(m);
        // Call prestige with ID
        window.performPrestige(id);
    }
};

function renderBuildings(container) {
    container.innerHTML = "";
    const buildingKeys = Object.keys(gameState.buildings);

    buildingKeys.forEach(name => {
        const b = gameState.buildings[name];
        // Show if unlocked (e.g. if we have 50% of base cost clicks ever?)
        // For now show all or filter by era index logic if desired.
        // Let's show all for simplicity of scaling.

        const currentCost = b.cost;
        let costMult = getGlobalMultiplier("cost", null);
        const finalCost = Math.floor(currentCost * costMult);

        const btn = document.createElement("button");
        btn.id = `btn-${name}`;
        btn.className = "building-btn";
        // Inline style for layout
        btn.style.width = "100%";
        btn.style.marginBottom = "5px";
        btn.style.padding = "10px";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.textAlign = "left";
        btn.style.justifyContent = "flex-start";
        btn.style.gap = "10px";

        btn.innerHTML = `
            <div style="font-size:24px;">${b.icon}</div>
            <div>
                <strong>Buy ${name}</strong><br>
                <small>Cost: ${finalCost}</small> | <small>Owned: ${b.count}</small><br>
                <small>Prod: ${b.production}</small>
            </div>
        `;
        btn.onclick = () => window.buyBuilding(name);
        btn.disabled = gameState.resources.clicks < finalCost;

        container.appendChild(btn);
    });
}

function updateUI() {
    checkFeatureUnlocks(); // Update tab visibility
    checkTutorials(gameState); // Check for FTUE triggers

    const eraInfo = ERA_DATA.find(e => e.name === gameState.era) || ERA_DATA[0];
    // Remove all era classes first to avoid buildup/conflict, but keep accessibility
    ERA_DATA.forEach(e => document.body.classList.remove(e.className));
    document.body.classList.add(eraInfo.className);

    // Inject Building List if missing (replacing static HTML)
    const buildingContainer = document.getElementById("buildings-container") || document.getElementById("main-area");
    if (buildingContainer) {
        let list = document.getElementById("building-list");
        if (!list) {
            // Clear hardcoded static buttons first if they exist
            // This assumes buildings-container is the wrapper for them
            // We want to replace the inner content with our dynamic list
            // But main-area has other stuff.
            // Let's look for a specific wrapper. In index.html usually there's a div.
            // If we can't find it, we create one in main-area.
            list = document.createElement("div");
            list.id = "building-list";
            list.style.width = "100%";
            list.style.maxWidth = "600px";

            // Insert after click button
            const clickBtn = document.getElementById("click-btn");
            if (clickBtn && clickBtn.parentNode) {
                clickBtn.parentNode.insertBefore(list, clickBtn.nextSibling);
            } else {
                buildingContainer.appendChild(list);
            }
        }

        // Render Buildings
        renderBuildings(list);
    }

    document.getElementById("res-clicks").innerText = Math.floor(gameState.resources.clicks);
    document.getElementById("res-net-production").innerText = (gameState.netProduction || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
    document.getElementById("res-knowledge").innerText = Math.floor(gameState.resources.knowledge);
    document.getElementById("res-culture").innerText = Math.floor(gameState.resources.culture);
    document.getElementById("res-shards").innerText = gameState.resources.relicShards;

    // Loot resources
    const lootContainer = document.getElementById("loot-resources");
    if (lootContainer) {
        const resourceConfig = [
            { key: "wood", icon: "🪵", era: "Stone Age" },
            { key: "stone", icon: "🪨", era: "Stone Age" },
            { key: "food", icon: "🍞", era: "Stone Age" },
            { key: "iron", icon: "🔩", era: "Iron Age" },
            { key: "steel", icon: "🏗️", era: "Industrial Age" },
            { key: "oil", icon: "🛢️", era: "Industrial Age" },
            { key: "uranium", icon: "☢️", era: "Modern Age" },
            { key: "energy", icon: "⚡", era: "Modern Age" }
        ];

        // Helper to find era index
        const getEraIndex = (name) => ERA_DATA.findIndex(e => e.name === name);
        const currentEraIdx = getEraIndex(gameState.era);

        let html = "";
        resourceConfig.forEach(res => {
            const unlockIdx = getEraIndex(res.era);
            const hasResource = gameState.resources[res.key] > 0;

            // Show if unlocked by Era OR if player has found some (e.g. from unique reward)
            if (currentEraIdx >= unlockIdx || hasResource) {
                html += `<span>${res.icon} ${Math.floor(gameState.resources[res.key])}</span> | `;
            }
        });

        // Remove trailing separator
        if (html.endsWith(" | ")) html = html.substring(0, html.length - 3);

        lootContainer.innerHTML = html;
    }
    document.getElementById("res-se").innerText = gameState.resources.symbolsOfEra;

    const prestigeBtn = document.getElementById("btn-prestige");
    if (prestigeBtn) {
        const gain = calculatePrestigeGain();
        prestigeBtn.innerText = `Prestige (+${gain} 🏛️)`;
    }

    // Prestige: Challenges & Ascension Tree
    const ascContainer = document.getElementById("ascension-list");
    if (ascContainer) {
        ascContainer.innerHTML = `<button onclick="renderChallengeMenu()" style="width:100%; margin-bottom:10px; background:#8e44ad;">⚔️ Challenge Modes</button>`;

        if (gameState.activeChallenge) {
            const c = CHALLENGES.find(x => x.id === gameState.activeChallenge);
            ascContainer.innerHTML += `<div style="background:#c0392b; padding:5px; margin-bottom:10px; border-radius:4px;">ACTIVE: ${c ? c.name : 'Unknown'}</div>`;
        }

        // Render Tree Button
        const treeBtn = document.createElement("button");
        treeBtn.innerText = "Open Ascension Tree 🌌";
        treeBtn.style.width = "100%";
        treeBtn.style.background = "radial-gradient(circle, #8e44ad, #2c3e50)";
        treeBtn.onclick = () => renderAscensionTree();
        ascContainer.appendChild(treeBtn);

        // Constellations
        const starBtn = document.createElement("button");
        starBtn.innerText = "Stellar Map ✨";
        starBtn.style.width = "100%";
        starBtn.style.marginTop = "5px";
        starBtn.style.background = "#000";
        starBtn.style.border = "1px solid #f1c40f";
        starBtn.onclick = () => renderConstellationMenu();
        ascContainer.appendChild(starBtn);
    }
}

window.renderAscensionTree = function() {
    if (document.getElementById("ascension-modal")) return;

    const modal = document.createElement("div");
    modal.id = "ascension-modal";
    modal.className = "modal-overlay";

    // SVG Container
    let html = `
        <div class="modal-content" style="width: 90%; height: 90%; background: #111;">
            <h2>Ascension Tree</h2>
            <p>Spend Symbols of Era to unlock permanent upgrades.</p>
            <div style="position: relative; width: 800px; height: 500px; margin: 0 auto; overflow: auto; border: 1px solid #444;">
                <svg id="ascension-svg" width="800" height="500" style="position:absolute; top:0; left:0;"></svg>
                <div id="ascension-nodes"></div>
            </div>
            <button onclick="document.body.removeChild(document.getElementById('ascension-modal'))" style="margin-top:10px;">Close</button>
        </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // Render Nodes & Lines
    const svg = document.getElementById("ascension-svg");
    const container = document.getElementById("ascension-nodes");

    // 1. Draw Lines
    ASCENSION_TREE.forEach(node => {
        if (node.req) {
            node.req.forEach(reqId => {
                const parent = ASCENSION_TREE.find(n => n.id === reqId);
                if (parent) {
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", parent.x + 25); // Center offset (50px width)
                    line.setAttribute("y1", parent.y + 25);
                    line.setAttribute("x2", node.x + 25);
                    line.setAttribute("y2", node.y + 25);
                    const isUnlocked = gameState.ascensionPerks && gameState.ascensionPerks.includes(node.id);
                    line.setAttribute("stroke", isUnlocked ? "#f1c40f" : "#555");
                    line.setAttribute("stroke-width", "3");
                    svg.appendChild(line);
                }
            });
        }
    });

    // 2. Draw Nodes
    ASCENSION_TREE.forEach(node => {
        const isUnlocked = gameState.ascensionPerks && gameState.ascensionPerks.includes(node.id);
        const canUnlock = !isUnlocked && node.req.every(r => gameState.ascensionPerks && gameState.ascensionPerks.includes(r)) && gameState.resources.symbolsOfEra >= node.cost;

        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = `${node.x}px`;
        div.style.top = `${node.y}px`;
        div.style.width = "50px";
        div.style.height = "50px";
        div.style.borderRadius = "50%";
        div.style.background = isUnlocked ? "#f1c40f" : (canUnlock ? "#3498db" : "#555");
        div.style.border = "2px solid #fff";
        div.style.cursor = "pointer";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.fontSize = "20px";
        div.title = `${node.name}\n${node.desc}\nCost: ${node.cost} SE`;
        div.innerText = "⭐"; // Icon placeholder

        div.onclick = () => {
            const res = buyAscensionPerk(gameState, node.id);
            if (res.success) {
                if (window.audioController) window.audioController.playUnlock();
                alert(res.msg);
                document.body.removeChild(modal);
                renderAscensionTree(); // Re-render to update
                updateUI();
            } else {
                alert(res.msg);
            }
        };

        container.appendChild(div);
    });


    renderQuests();
    renderInventory();
    renderExpeditions();
    renderCrafting();
    renderAchievements();
    renderWar();
    renderSpace();
    renderHeroes();
    renderGovernment();
    renderGovernors();
    renderCabinet();
    renderDiplomacy();
    renderReligion();
    renderTrade();
    renderWonders();
    renderCrisis();
    renderResearchTree();
}

function renderGovernors() {
    const container = document.getElementById("governors-view");
    if (!container || container.style.display === "none") return;

    let list = document.getElementById("governor-list");
    if (!list) {
        list = document.createElement("div");
        list.id = "governor-list";
        container.appendChild(list);
    }
    list.innerHTML = "";

    GOVERNORS.forEach(g => {
        // Show if unlocked (Era check?) - For now show all or filter
        // Simple filter: Show if Era index >= Governor Era Index
        const gEraIdx = ERA_DATA.findIndex(e => e.name === g.era);
        const currentEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);

        if (currentEraIdx >= gEraIdx) {
            const isHired = gameState.governors && gameState.governors.some(gov => gov.id === g.id);
            const div = document.createElement("div");
            div.className = `expedition-card ${isHired ? 'completed' : ''}`;

            let costText = "";
            for (let k in g.cost) costText += `${g.cost[k]} ${k} `;

            div.innerHTML = `
                <div style="float:left; font-size: 32px; margin-right: 15px;">${g.icon}</div>
                <strong>${g.name}</strong> (${g.era})<br>
                <small>${g.desc}</small><br>
                ${isHired ? generateGovernorControls(g.id) : `<small>Cost: ${costText}</small><br><button onclick="attemptHireGovernor('${g.id}')">Hire</button>`}
            `;
            list.appendChild(div);
        }
    });
}

function generateGovernorControls(id) {
    const gState = gameState.governors.find(g => g.id === id);
    const isActive = gState ? gState.active : true;
    const color = isActive ? "#2ecc71" : "#e74c3c";
    const text = isActive ? "ON" : "OFF";
    return `<button onclick="toggleGov('${id}')" style="background:${color}; width: 80px;">${text}</button>`;
}

window.toggleGov = function(id) {
    toggleGovernor(gameState, id);
    updateUI();
};

window.attemptHireGovernor = function(id) {
    const res = hireGovernor(gameState, id);
    if (res.success) {
        if (window.audioController) window.audioController.playBuy();
        alert(res.msg);
        updateUI();
    } else {
        alert(res.msg);
    }
};

function renderDiplomacy() {
    const container = document.getElementById("diplomacy-view");
    if (!container || container.style.display === "none") return;

    const diplo = getDiplomacyState(gameState);
    let list = document.getElementById("diplomacy-list");
    if (!list) {
        list = document.createElement("div");
        list.id = "diplomacy-list";
        container.appendChild(list);
    }
    list.innerHTML = "";

    for (let id in diplo) {
        const d = diplo[id];
        const div = document.createElement("div");
        div.className = "expedition-card";
        div.innerHTML = `
            <strong>${id}</strong><br>
            Relation: ${d.relation} (${d.status})<br>
            Trade: ${d.tradeDeal ? "Active" : "None"}<br>
            <button onclick="doDiplo('${id}', 'improve')">Improve (500$)</button>
            <button onclick="doDiplo('${id}', 'insult')">Insult</button>
            <button onclick="doDiplo('${id}', 'trade_agreement')">Trade Deal</button>
            <button onclick="doDiplo('${id}', 'alliance')">Alliance</button>
        `;
        list.appendChild(div);
    }

    renderEspionage();
    renderCongress();
}

function renderCongress() {
    const container = document.getElementById("congress-list");
    if (!container) return;
    container.innerHTML = "";

    if (!gameState.congress) gameState.congress = { activeLaws: [], activeResolution: null, timer: 300 };
    const cong = gameState.congress;

    // Status
    if (cong.sessionActive && cong.activeResolution) {
        // Find resolution
        // We need RESOLUTIONS import or fetch from somewhere.
        // Ah, RESOLUTIONS is not exported to window scope. I need access to it.
        // I can assume the ID is enough or reconstruct it.
        // Wait, I imported { initCongress, ..., RESOLUTIONS?? } No, I didn't import RESOLUTIONS.
        // I should import RESOLUTIONS in script.js to use it here.
        // For now, I'll just show ID or assume logic works if I import it.
        // Let's add RESOLUTIONS to the import block first?
        // Or I can add a helper "getResolution(id)" in congress.js.
        // Let's rely on basic display for now.

        const res = RESOLUTIONS.find(r => r.id === cong.activeResolution) || { name: cong.activeResolution, desc: "Unknown" };
        container.innerHTML = `
            <div style="background:#8e44ad; padding:10px; color:white;">
                <h4>⚠️ SESSION IN PROGRESS</h4>
                <p><strong>${res.name}</strong></p>
                <small>${res.desc}</small>
                <p>Time Left: ${Math.floor(cong.timer)}s</p>
                <button onclick="castVote('yes')">Vote YES</button>
                <button onclick="castVote('no')">Vote NO</button>
                <button onclick="castVote('abstain')">Abstain</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <p>Next Session in: ${Math.floor(cong.timer)}s</p>
            <h4>Active Laws:</h4>
            ${cong.activeLaws.length > 0 ? cong.activeLaws.join(", ") : "None"}
        `;
    }
}

window.castVote = function(option) {
    const res = vote(gameState, option);
    alert(res.msg);
    updateUI();
};

function renderEspionage() {
    const container = document.getElementById("espionage-list");
    if (!container) return;
    container.innerHTML = "";

    if (!gameState.espionage) gameState.espionage = { spies: [], maxSpies: 3 }; // ensure init

    // Header
    const cost = 1000 * Math.pow(2, gameState.espionage.spies.length);
    const header = document.createElement("div");
    header.innerHTML = `
        <p>Spies: ${gameState.espionage.spies.length} / ${gameState.espionage.maxSpies}</p>
        <button onclick="attemptTrainSpy()">Recruit Spy (${cost} Money)</button>
    `;
    container.appendChild(header);

    // Spies
    gameState.espionage.spies.forEach(spy => {
        const div = document.createElement("div");
        div.className = "expedition-card"; // Reuse

        if (spy.status === 'mission') {
            const timeLeft = Math.max(0, Math.floor((spy.missionEnd - Date.now())/1000));
            div.innerHTML = `
                <strong>🕵️ ${spy.name} (Lvl ${spy.level})</strong><br>
                Status: On Mission (${timeLeft}s)<br>
            `;
        } else {
            let missionOptions = "";
            SPY_MISSIONS.forEach(m => {
                missionOptions += `<button onclick="attemptMission(${spy.id}, '${m.id}')" style="font-size:10px; margin:2px;">${m.name} (${m.difficulty} Diff)</button>`;
            });

            div.innerHTML = `
                <strong>🕵️ ${spy.name} (Lvl ${spy.level})</strong><br>
                XP: ${spy.xp} / ${100 * spy.level}<br>
                ${missionOptions}
            `;
        }
        container.appendChild(div);
    });
}

window.attemptTrainSpy = function() {
    const res = trainSpy(gameState);
    if (res.success) {
        if (window.audioController) window.audioController.playBuy();
        alert(res.msg);
        updateUI();
    } else {
        alert(res.msg);
    }
};

window.attemptMission = function(spyId, missionId) {
    const res = startMission(gameState, spyId, missionId);
    if (res.success) {
        if (window.audioController) window.audioController.playEvent();
        alert(res.msg);
        updateUI();
    } else {
        alert(res.msg);
    }
};

window.doDiplo = function(id, action) {
    const res = interactDiplomacy(gameState, id, action);
    alert(res.msg);
    updateUI();
};

function renderReligion() {
    const container = document.getElementById("religion-view");
    if (!container || container.style.display === "none") return;

    renderMuseum(gameState); // Inject Museum here

    const rel = getReligionState(gameState);
    let ui = document.getElementById("religion-ui");
    if (!ui) {
        ui = document.createElement("div");
        ui.id = "religion-ui";
        container.appendChild(ui);
    }
    ui.innerHTML = "";

    if (!rel.founded) {
        ui.innerHTML = `
            <p>Religion requires 1000 Culture.</p>
            <input id="rel-name" placeholder="Religion Name">
            <button onclick="foundRel()">Found Religion</button>
        `;
    } else {
        let dogmasHtml = "";
        // Import DOGMAS? Or just hardcode list for UI?
        // Need to import DOGMAS for description.
        // For now, let's just list active ones.

        rel.dogmas.forEach(d => dogmasHtml += `<div>Checking dogma ${d}...</div>`);

        // Sanitize name to prevent XSS
        const safeName = rel.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        ui.innerHTML = `
            <h3>${safeName}</h3>
            <p>Faith: ${Math.floor(rel.faith)}</p>
            <div>Dogmas: ${rel.dogmas.join(", ")}</div>
            <hr>
            <h4>Adopt Dogma (100 Faith)</h4>
            <button onclick="adoptDog('pacifism')">Pacifism (+Happiness)</button>
            <button onclick="adoptDog('crusade')">Holy War (+Army)</button>
            <button onclick="adoptDog('tithing')">Tithing (+Money)</button>
            <button onclick="adoptDog('scholasticism')">Scholasticism (+Knowl)</button>
        `;
    }
}

window.foundRel = function() {
    const name = document.getElementById("rel-name").value;
    if (!name) return;
    const res = foundReligion(gameState, name);
    alert(res.msg);
    updateUI();
};

window.adoptDog = function(id) {
    const res = adoptDogma(gameState, id);
    alert(res.msg);
    updateUI();
};

// Hook renderMuseum into renderReligion or separate?
// Let's call it from updateUI or inside renderReligion if we group them.
// Actually, let's group it inside renderReligion for simplicity as "Culture" tab equivalent.

function renderCabinet() {
    const container = document.getElementById("cabinet-view");
    if (!container || container.style.display === "none") return;

    let list = document.getElementById("minister-list");
    if (!list) {
        list = document.createElement("div");
        list.id = "minister-list";
        container.appendChild(list);
    }
    list.innerHTML = "";

    MINISTERS.forEach(min => {
        // Get State
        let state = gameState.ministries ? gameState.ministries[min.id] : null;
        if (!state) state = { level: 1, xp: 0 }; // Fallback display

        // XP progress
        const cost = Math.floor(100 * Math.pow(1.5, state.level - 1));
        const pct = Math.min(100, Math.floor((state.xp / cost) * 100));

        // Active Tactics
        let tacticHtml = "";
        min.tactics.forEach(t => {
            const unlocked = state.level >= t.level;
            tacticHtml += `<div style="color: ${unlocked ? '#2ecc71' : '#7f8c8d'}; font-size:10px;">
                ${unlocked ? '✅' : '🔒'} Lvl ${t.level}: ${t.name} (${t.desc})
            </div>`;
        });

        const div = document.createElement("div");
        div.className = "expedition-card";
        div.innerHTML = `
            <div style="float:left; font-size: 32px; margin-right: 15px;">${min.icon}</div>
            <strong>${min.title}</strong> (Lvl ${state.level})<br>
            <small>${min.name} - ${min.desc}</small>
            <div class="expedition-progress-bg" style="height: 5px; margin: 5px 0;">
                <div class="expedition-progress-fill" style="width: ${pct}%"></div>
            </div>
            <div>${tacticHtml}</div>
        `;
        list.appendChild(div);
    });
}

function renderCampaignModal() {
    if (document.getElementById("campaign-modal")) return;

    const modal = document.createElement("div");
    modal.id = "campaign-modal";
    modal.className = "modal-overlay";

    let html = `
        <div class="modal-content">
            <h2>Story Campaign</h2>
            <p>Complete chapters to unlock cosmetics and permanent buffs.</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
    `;

    CAMPAIGN_CHAPTERS.forEach(chap => {
        const completed = gameState.campaign && gameState.campaign.completed.includes(chap.id);
        const locked = !completed && gameState.campaign.completed.length < CAMPAIGN_CHAPTERS.indexOf(chap);

        // Objectives HTML
        let objHtml = "";
        chap.objectives.forEach(obj => {
            let met = false;
            // Simplified check for UI visualization
            if (obj.type === "resource") met = (gameState.resources[obj.key] || 0) >= obj.target;
            if (obj.type === "building") met = (gameState.buildings[obj.key] ? gameState.buildings[obj.key].count : 0) >= obj.target;
            if (obj.type === "era") met = (gameState.era === obj.target) || (ERA_DATA.findIndex(e => e.name === gameState.era) >= ERA_DATA.findIndex(e => e.name === obj.target));

            // If already completed whole chapter, mark all met
            if (completed) met = true;

            objHtml += `<div style="font-size:11px; color:${met ? '#2ecc71' : '#e74c3c'}">${met ? '✓' : '○'} ${obj.desc}</div>`;
        });

        html += `
            <div style="border: 1px solid #7f8c8d; padding: 10px; background: ${completed ? 'rgba(46, 204, 113, 0.2)' : (locked ? 'rgba(0,0,0,0.5)' : 'rgba(52, 152, 219, 0.2)')}; text-align:left;">
                <div style="display:flex; justify-content:space-between;">
                    <strong>${chap.title}</strong>
                    <span>${completed ? 'COMPLETE' : (locked ? 'LOCKED' : 'ACTIVE')}</span>
                </div>
                <small style="font-style:italic">"${chap.lore}"</small>
                <div style="margin-top:5px;">${objHtml}</div>
                <small style="color:#f1c40f">Reward: ${chap.reward.text}</small>
            </div>
        `;
    });

    html += `<button onclick="document.body.removeChild(document.getElementById('campaign-modal'))" style="background:#c0392b; margin-top:20px;">Close</button></div></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

window.renderCampaignModal = renderCampaignModal;

function renderTrade() {
    const container = document.getElementById("trade-view");
    if (!container || container.style.display === "none") return;

    let list = document.getElementById("trade-list");
    if (!list) {
        list = document.createElement("div");
        list.id = "trade-list";
        container.appendChild(list);
    }
    list.innerHTML = "";

    // Iterate tradeable resources
    for (let res in TRADE_RATES) {
        const rate = TRADE_RATES[res];
        const div = document.createElement("div");
        div.className = "expedition-card";
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";

        div.innerHTML = `
            <div>
                <strong>${res.toUpperCase()}</strong><br>
                <small>Buy: ${rate.buy} | Sell: ${rate.sell}</small>
            </div>
            <div>
                <button onclick="attemptTrade('buy', '${res}', 10)">Buy 10</button>
                <button onclick="attemptTrade('sell', '${res}', 10)">Sell 10</button>
                <button onclick="attemptTrade('buy', '${res}', 100)">x100</button>
                <button onclick="attemptTrade('sell', '${res}', 100)">x100</button>
            </div>
        `;
        list.appendChild(div);
    }

    renderStockMarket();
}

function renderStockMarket() {
    const container = document.getElementById("stock-list");
    if (!container) return;
    container.innerHTML = "";

    if (!gameState.stockMarket) gameState.stockMarket = { stocks: {} };
    const stocks = gameState.stockMarket.stocks;

    COMPANIES.forEach(c => {
        const stock = stocks[c.id] || { currentPrice: c.basePrice, owned: 0 };
        const price = Math.floor(stock.currentPrice);
        const change = stock.history && stock.history.length > 1 ?
            Math.floor(((stock.currentPrice - stock.history[stock.history.length-2]) / stock.history[stock.history.length-2]) * 100) : 0;

        const color = change >= 0 ? "#2ecc71" : "#e74c3c";
        const sign = change >= 0 ? "+" : "";

        const div = document.createElement("div");
        div.className = "expedition-card";
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <strong>${c.name}</strong> (${c.industry})<br>
                    Price: <span style="color:${color}">${price} (${sign}${change}%)</span><br>
                    Owned: ${stock.owned}
                </div>
                <div>
                    <button onclick="doStock('buy', '${c.id}', 1)">Buy 1</button>
                    <button onclick="doStock('buy', '${c.id}', 10)">Buy 10</button>
                    <button onclick="doStock('sell', '${c.id}', 1)">Sell 1</button>
                    <button onclick="doStock('sell', '${c.id}', 10)">Sell 10</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

window.doStock = function(action, id, amount) {
    if (action === "buy") {
        const res = buyStock(gameState, id, amount);
        alert(res.msg);
    } else {
        const res = sellStock(gameState, id, amount);
        alert(res.msg);
    }
    updateUI();
};

window.attemptTrade = function(action, resource, amount) {
    const res = tradeResource(gameState, action, resource, amount);
    if (res.success) {
        if (window.audioController) window.audioController.playBuy();
        // Don't alert on trade success to allow spamming, just update UI
        // Or show a toast?
        updateUI();
    } else {
        alert(res.msg);
    }
};

function renderWonders() {
    const container = document.getElementById("wonders-view");
    if (!container || container.style.display === "none") return;

    // Assuming structure exists, else inject
    let list = document.getElementById("wonder-list");
    if (!list) {
        list = document.createElement("div");
        list.id = "wonder-list";
        container.appendChild(list);
    }

    list.innerHTML = "";

    WONDERS.forEach(w => {
        // Only show if visible (based on Era?)
        // Let's show all for now or filter by current era index

        const isBuilt = gameState.wonders && gameState.wonders.includes(w.id);
        const div = document.createElement("div");
        div.className = `expedition-card ${isBuilt ? 'completed' : ''}`;

        let costText = "";
        for (let k in w.cost) costText += `${w.cost[k]} ${k} `;

        div.innerHTML = `
            <div style="float:left; font-size: 32px; margin-right: 15px;">${w.icon}</div>
            <strong>${w.name}</strong> (${w.era})<br>
            <small>${w.description}</small><br>
            <span style="color: #f1c40f">${w.bonusText}</span><br>
            ${isBuilt ? "<strong>CONSTRUCTED</strong>" : `<small>Cost: ${costText}</small><br><button onclick="attemptBuildWonder('${w.id}')">Build Wonder</button>`}
        `;
        list.appendChild(div);
    });
}

window.attemptBuildWonder = function(id) {
    const res = buildWonder(gameState, id);
    if (res.success) {
        if (window.audioController) window.audioController.playEvent();

        const w = WONDERS.find(x => x.id === id);
        if (window.mapEngine && w) {
            window.mapEngine.addBuilding("Wonder", w.icon);
        }

        alert(res.msg);
        updateUI();
    } else {
        alert(res.msg);
    }
};

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

    // Dynasty Info
    let dynastyHtml = "";
    if (gameState.dynasty && gameState.dynasty.currentRuler) {
        const r = gameState.dynasty.currentRuler;
        const heir = gameState.dynasty.heir;

        let traitHtml = "";
        r.traits.forEach(t => traitHtml += `<span class="tag">${t.name}</span> `);

        dynastyHtml = `
            <div style="background: rgba(241, 196, 15, 0.1); padding: 10px; border: 1px solid #f1c40f; margin-bottom: 10px;">
                <h4>👑 Ruling Dynasty: ${r.name} (Age: ${Math.floor(r.age)})</h4>
                <p>Traits: ${traitHtml}</p>
                <small>Heir: ${heir ? heir.name : "None"} (${heir ? Math.floor(heir.age) : 0})</small>
            </div>
        `;
    }

    document.getElementById("gov-current").innerHTML = `
        ${dynastyHtml}
        Current Form: <strong>${currentGov.name}</strong><br><small>${currentGov.desc}</small>
    `;

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
                view.innerHTML = `<h3>Space Exploration <button class="help-btn" onclick="showHelp('space')">?</button></h3><div id="planet-list"></div>`;
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
            ${!p.colonized ?
                `<small>Cost: ${costText}</small><br><button onclick="attemptColonize('${p.id}')">Colonize</button>` :
                `<small>Producing: ${p.production.money} Gold, ${p.production.knowledge} Knowl / sec</small><br>
                 <small>Terraform Lvl: ${p.terraformLevel || 0} / 5</small><br>
                 <button onclick="attemptTerraform('${p.id}')">Terraform (Cost: ${5000 * Math.pow(2, p.terraformLevel || 0)} Energy)</button>`
            }
        `;
        list.appendChild(div);
    });
}

window.attemptTerraform = function(planetId) {
    const res = terraformPlanet(gameState, planetId);
    if (res.success) {
        if (window.audioController) window.audioController.playEvent();
        alert(res.msg);
        updateUI();
    } else {
        alert(res.msg);
    }
};

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

    // Tactics Selector
    let tacticSel = document.getElementById("tactic-select");
    if (!tacticSel) {
        tacticSel = document.createElement("select");
        tacticSel.id = "tactic-select";
        tacticSel.onchange = () => updateUI(); // Recalc power
        TACTICS.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.innerText = t.name;
            tacticSel.appendChild(opt);
        });
        // Insert before rivals
        document.getElementById("rival-list").parentNode.insertBefore(tacticSel, document.getElementById("rival-list"));
        // Label
        const label = document.createElement("div");
        label.innerText = "Select Tactic:";
        tacticSel.parentNode.insertBefore(label, tacticSel);
    }

    const selectedTactic = tacticSel.value;
    let power = calculateArmyPower(gameState.army || {}, selectedTactic);
    const armyMult = getGlobalMultiplier("army_power", null);
    power = Math.floor(power * armyMult);
    document.getElementById("army-power").innerText = `Army Power: ${power}`;
}

window.trainUnit = function(unitKey) {
    // Challenge Constraint: No War
    if (gameState.activeChallenge === "pacifist") {
        alert("Challenge Constraint: Cannot train military units!");
        return;
    }

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

    const tactic = document.getElementById("tactic-select") ? document.getElementById("tactic-select").value : null;
    const armyMult = getGlobalMultiplier("army_power", null);
    const result = resolveCombat(gameState.army, rival, armyMult, tactic);

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

        // Paradox, Civ, Hero Check
        const pMult = getGlobalMultiplier("production_mult", type);
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
