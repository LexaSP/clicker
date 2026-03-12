// script.js
import { generateRelics, generateResearch, generateIdeas, generateExpeditions, generateRecipes } from './content-gen.js';
import { AudioController } from './audio.js';
import { ACHIEVEMENTS, checkAchievements } from './achievements.js';
import { RANDOM_EVENTS } from './events.js';
import { PARADOXES, checkParadoxes, getParadoxMultiplier } from './paradox.js';
import { UNITS, RIVALS, calculateArmyPower, resolveCombat, TACTICS, startBattle, updateBattle, retreatBattle } from './combat.js';
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
import { initStockMarket, updateStockMarket, buyStock, sellStock, applyWarEconomy, COMPANIES } from './stock_market.js';
import { initCongress, updateCongress, vote, getCongressMultiplier, RESOLUTIONS } from './congress.js';
import { renderLeaderboardModal, checkLeaderboardRewards, submitScore } from './leaderboard.js';
import { initMuseum, getMuseumMultiplier, renderMuseum } from './museum.js';
import { renderModdingMenu } from './modding.js';
import { initConstellations, getConstellationMultiplier, renderConstellationMenu } from './constellations.js';
import { checkTutorials, initTutorials } from './tutorial.js';

// Expose to window for HTML onClick
window.renderLeaderboardModal = renderLeaderboardModal;
window.renderModdingMenu = renderModdingMenu;

// --- Cloud Save (Dynamic Import) ---
let firebaseModule = null;
let firebaseAuthModule = null;

async function initCloudSave() {
    try {
        console.log("Attempting to initialize Cloud Save...");
        // Dynamic import to handle offline/sandbox environments where external URLs might fail
        firebaseModule = await import('./firebase-db.js');

        firebaseAuthModule = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");

        if (firebaseModule && firebaseAuthModule) {
             firebaseAuthModule.onAuthStateChanged(firebaseModule.auth, async (user) => {
                const btn = document.getElementById("btn-cloud-login");
                if (user) {
                    currentUser = user;
                    console.log("Logged in as:", user.displayName);
                    if (btn) btn.innerText = "Logout (" + (user.displayName || "User") + ")";

                    // Attempt to load cloud save
                    try {
                        const cloudData = await firebaseModule.loadFromCloud(user.uid);
                        if (cloudData) {
                            if (confirm("Found a cloud save! Load it? This will overwrite your local save.")) {
                                Object.assign(gameState, cloudData);
                                // Ensure legacy saves are migrated (Era strings to numbers)
                                migrateSaveData(gameState);
                                localStorage.setItem("hc_web_save", JSON.stringify(gameState));
                                updateUI();
                                alert("Cloud save loaded!");
                            }
                        }
                    } catch (err) {
                        console.error("Failed to load cloud save:", err);
                    }
                } else {
                    currentUser = null;
                    console.log("Logged out");
                    if (btn) btn.innerText = "Cloud Login";
                }
            });
            // Inject Button into Sidebar
            injectCloudButton();
        }

    } catch (e) {
        console.warn("Cloud Save disabled (Offline/Error):", e);
        const btn = document.getElementById("btn-cloud-login");
        if (btn) btn.style.display = "none";
    }
}

function injectCloudButton() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar && !document.getElementById("btn-cloud-login")) {
        const btn = document.createElement("button");
        btn.id = "btn-cloud-login";
        btn.style.width = "100%";
        btn.style.padding = "10px";
        btn.style.marginBottom = "10px";
        btn.style.marginTop = "10px";
        btn.style.background = "#3498db";
        btn.style.color = "white";
        btn.style.border = "none";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";

        btn.innerText = "Cloud Login";
        btn.onclick = () => {
            if (currentUser) window.cloudLogout();
            else window.cloudLogin();
        };

        const storyBtn = document.getElementById("btn-story");
        if (storyBtn) {
            sidebar.insertBefore(btn, storyBtn);
        } else {
            sidebar.prepend(btn);
        }
    }
}

window.cloudLogin = async function() {
    if (firebaseModule) {
        try {
            await firebaseModule.login();
        } catch (e) {
            console.warn("Cloud login error:", e);
            alert("Cloud services are currently unavailable. Please use 'Save to File' in the Settings menu.");
        }
    } else {
        alert("Cloud services are currently unavailable. Please use 'Save to File' in the Settings menu.");
    }
};

window.cloudLogout = async function() {
    if (firebaseModule) {
        try {
            await firebaseModule.logout();
            alert("Logged out.");
        } catch (e) {
            alert("Logout failed: " + e.message);
        }
    }
};

// --- Helpers ---
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return Math.floor(num);
}

function spawnFloatingText(x, y, text, color = "#fff") {
    const el = document.createElement("div");
    el.innerText = text;
    el.className = "floating-text";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    document.body.appendChild(el);

    setTimeout(() => {
        if (document.body.contains(el)) document.body.removeChild(el);
    }, 1000);
}

// --- Game State ---
let currentUser = null;

let gameState = {
    resources: {
        clicks: 0,
        lifetimeClicks: 0,
        money: 0,
        knowledge: 0,
        culture: 0,
        population: 0, // Core Population
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
    craftedItems: [],
    activeResearch: [], // Currently researching
    researched: [], // Completed research IDs
    ideas: [], // Unlocked ideas
    expeditions: [], // Available
    activeExpeditions: [],
    quests: [], // Daily quests
    achievements: [], // Unlocked achievements
    paradoxes: [], // Triggered paradoxes
    army: {}, // { "Warrior": 10, ... }
    battle: null, // Active battle state
    warWeariness: 0, // Global war penalty
    space: { planets: [] }, // Space exploration
    heroes: { owned: [], gpp: 0, threshold: 1000 }, // Great People
    government: { type: "gov_tribal", policies: [] }, // Government
    governors: [], // Hired governors
    wonders: [], // Built wonders IDs
    activeChallenge: null, // ID of current challenge
    completedChallenges: [], // List of completed IDs
    crisis: { active: false, threat: 0, defeated: false }, // Endgame
    civilizationHistory: {}, // { "Bronze Age": { id: "egypt", ... } }

    victoryClaimed: false,
    stats: {
        totalClicks: 0, // Manual clicks
        expeditionsCompleted: 0,
        relicsFound: 0,
        buildingsBought: 0,
        techsResearched: 0,
        transcendenceCount: 0,
        history: {} // Per era stats
    },

    ascensionPerks: [], // Unlocked Tree Perks
    ministries: {}, // { defense: { level: 1, xp: 0 } }
    campaign: { completed: [] }, // Story progress

    // Upgrades / Buildings (NERFED & REBALANCED)
    // Era indices: Stone=0, Bronze=1, Iron=2, Middle=3, Ren=4, Ind=5, Mod=6, Info=7, Future=8
    buildings: {
        // Ancient
        "AutoClicker": { count: 0, baseCost: 15, priceRatio: 1.15, production: 0.5, icon: "👆", era: 0 },
        "Gatherer": { count: 0, baseCost: 50, priceRatio: 1.15, production: 1, icon: "🧺", era: 0, produces: { food: 0.5, wood: 0.1 } },
        "LumberCamp": { count: 0, baseCost: 150, priceRatio: 1.15, production: 2, icon: "🪓", era: 0, produces: { wood: 1.5 } }, // New dedicated wood producer
        "Farm": { count: 0, baseCost: 250, priceRatio: 1.15, production: 3, icon: "🌾", era: 1, produces: { food: 2 } },
        "Mine": { count: 0, baseCost: 1000, priceRatio: 1.20, production: 10, icon: "⛏️", era: 1, upkeep: { wood: 1 }, produces: { stone: 0.5, iron: 0.1 } },
        "Workshop": { count: 0, baseCost: 5000, priceRatio: 1.20, production: 25, icon: "🔨", era: 2, upkeep: { stone: 2 }, produces: { steel: 0.05 } },

        // Classical/Medieval
        "Aqueduct": { count: 0, baseCost: 15000, priceRatio: 1.25, production: 50, icon: "💧", era: 2, produces: { food: 5 } },
        "University": { count: 0, baseCost: 50000, priceRatio: 1.25, production: 100, icon: "🎓", era: 3 }, // Knowledge handled separately
        "Bank": { count: 0, baseCost: 250000, priceRatio: 1.30, production: 250, icon: "🏦", era: 4 }, // Money handled separately

        // Industrial/Modern
        "Factory": { count: 0, baseCost: 1000000, priceRatio: 1.30, production: 800, icon: "🏭", era: 5, upkeep: { iron: 2, energy: 5 }, produces: { oil: 0.1, steel: 0.5 } },
        "Lab": { count: 0, baseCost: 5000000, priceRatio: 1.35, production: 1500, icon: "🔬", era: 6 }, // Knowledge
        "PowerPlant": { count: 0, baseCost: 25000000, priceRatio: 1.40, production: 5000, icon: "⚡", era: 5, upkeep: { wood: 5 }, produces: { energy: 10 } }, // Moved to Era 5 to feed Factory

        // Future
        "Supercomputer": { count: 0, baseCost: 100000000, priceRatio: 1.45, production: 20000, icon: "🖥️", era: 7 },
        "FusionReactor": { count: 0, baseCost: 1000000000, priceRatio: 1.50, production: 100000, icon: "⚛️", era: 8, produces: { energy: 100 } }
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
    { name: "Bronze Age", threshold: 5000, className: "era-bronze" }, // Increased Thresholds
    { name: "Iron Age", threshold: 50000, className: "era-iron" },
    { name: "Middle Ages", threshold: 250000, className: "era-middle" },
    { name: "Renaissance", threshold: 1000000, className: "era-renaissance" },
    { name: "Industrial Age", threshold: 10000000, className: "era-industrial" },
    { name: "Modern Age", threshold: 100000000, className: "era-modern" },
    { name: "Information Age", threshold: 1000000000, className: "era-info" },
    { name: "Future Age", threshold: 10000000000, className: "era-future" }
];

// --- Unlocks Config (Strict) ---
const FEATURE_UNLOCKS = {
    // Static Tabs (IDs in index.html)
    "tab-btn-expeditions": { era: "Bronze Age" },
    "tab-btn-war": { era: "Future Age" }, // QUARANTINED: MVP logic pending
    "tab-btn-government": { era: "Future Age" }, // QUARANTINED: MVP logic pending
    "tab-btn-crafting": { era: "Iron Age" },
    "tab-btn-heroes": { era: "Middle Ages" },

    // Dynamic/Panel Buttons
    "tab-btn-trade": { era: "Iron Age" },
    "tab-btn-wonders": { era: "Middle Ages" },
    "tab-btn-religion": { era: "Middle Ages" },
    "tab-btn-diplomacy": { era: "Renaissance" },
    "tab-btn-espionage": { era: "Renaissance" },
    "tab-btn-governors": { era: "Industrial Age" },
    "tab-btn-cabinet": { era: "Modern Age" },
    "tab-btn-congress": { era: "Modern Age" },
    "tab-btn-space": { era: "Future Age" },
    "tab-btn-leaderboard": { era: "Bronze Age" },
    "tab-btn-mods": { era: "Future Age" }
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

    // 1. Critical Logic Setup (Synchronous)
    try {
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

        // Generate quests if needed (Synchronous, before UI)
        // Ensure this happens AFTER loadGame so we check the loaded state
        if (!gameState.quests || gameState.quests.length === 0) {
            generateDailyQuests();
        }

        // 2. UI Initialization (Synchronous - Critical for display)
        // Must happen BEFORE visibility updates
        initBuildingsUI();
        initUI(); // This calls renderResearchTree, injectDynamicTabs, and initAscensionUI
        renderQuestList(); // Initial render of quests
        initTutorials(gameState);

        // 3. Apply Visibility Logic
        updateVisibility();

        // 4. Start Game Loop
        startGameLoop();

        // 5. Init Audio/Visuals
        window.audioController = new AudioController();
        window.mapEngine = new MapEngine();

        // Expose
        window.gameState = gameState;
        window.allResearch = allResearch;

        // Event Tick
        setInterval(() => checkStoryEvents(), 15000);

        console.log("Game Core Initialized Successfully");

        // 6. Non-Blocking Async Features (Cloud Save)
        // This is wrapped to NOT block the game if it fails
        initCloudSave().catch(e => console.warn("Cloud init failed gracefully:", e));

    } catch (e) {
        console.error("CRITICAL INIT ERROR:", e);
        alert("Game Initialization Failed! Check console.");
    }
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


// ─── MILESTONE BONUSES ────────────────────────────────────────────────────────
// Каждое кратное 10/25/50/100/200/500 зданий удваивает его производство
const MILESTONE_TIERS = [10, 25, 50, 100, 200, 500];

function getBuildingMilestoneMult(count) {
    let m = 1;
    for (const t of MILESTONE_TIERS) { if (count >= t) m *= 2; else break; }
    return m;
}
function getNextMilestone(count) {
    for (const t of MILESTONE_TIERS) { if (count < t) return t; }
    return null;
}

// ─── BUILDING UPGRADE SYSTEM ──────────────────────────────────────────────────
// Кнопка ⬆️ рядом с каждым зданием, каждый тир × 2 к производству
// Стоимость: baseCost × 10 × tier^2.5. Переживает prestiges.

function getBuildingUpgradeCost(name, tier) {
    const b = gameState.buildings[name];
    if (!b) return Infinity;
    return Math.floor(b.baseCost * 10 * Math.pow(tier + 1, 2.5));
}
function getBuildingUpgradeMult(name) {
    if (!gameState.buildingUpgrades) return 1;
    return Math.pow(2, gameState.buildingUpgrades[name] || 0);
}
window.buyBuildingUpgrade = function(name) {
    if (!gameState.buildingUpgrades) gameState.buildingUpgrades = {};
    const tier = gameState.buildingUpgrades[name] || 0;
    const cost = getBuildingUpgradeCost(name, tier);
    if (gameState.resources.clicks < cost) return;
    gameState.resources.clicks -= cost;
    gameState.buildingUpgrades[name] = tier + 1;
    updateUI();
    const msg = document.getElementById('game-log');
    if (msg) {
        const p = document.createElement('p');
        p.style.cssText = 'margin:2px 0;font-size:11px;border-bottom:1px solid #333;padding:2px 0';
        p.textContent = `⬆️ ${name} upgraded to tier ${tier+1} (×${Math.pow(2,tier+1)} output)`;
        msg.prepend(p);
        while (msg.children.length > 40) msg.removeChild(msg.lastChild);
    }
};

// ─── BULK BUY ─────────────────────────────────────────────────────────────────
let buyAmount = 1; // 1 | 10 | 100 | 0=max

function getBulkCost(name, n) {
    const b = gameState.buildings[name];
    if (!b || n <= 0) return Infinity;
    const r = b.priceRatio;
    const cm = getGlobalMultiplier("cost", null);
    // геометрическая сумма: baseCost * r^count * (r^n - 1) / (r - 1)
    return Math.floor(b.baseCost * Math.pow(r, b.count) * (Math.pow(r, n) - 1) / (r - 1) * cm);
}
function calcMaxBuy(name) {
    const b = gameState.buildings[name];
    if (!b) return 0;
    let n = 0, total = 0;
    const cm = getGlobalMultiplier("cost", null);
    while (true) {
        const c = Math.floor(b.baseCost * Math.pow(b.priceRatio, b.count + n) * cm);
        if (total + c > gameState.resources.clicks) break;
        total += c; n++;
        if (n > 5000) break;
    }
    return n;
}
window.setBuyAmount = function(n) {
    buyAmount = n;
    [1,10,100,0].forEach(v => {
        const btn = document.getElementById('buy-toggle-'+v);
        if (btn) btn.style.background = v === n ? '#f39c12' : '#555';
    });
    updateUI();
};
window.buyBulkBuilding = function(name) {
    const b = gameState.buildings[name];
    if (!b) return;
    if (gameState.activeChallenge === 'one_city' && b.count >= 1) {
        alert('Challenge: Max 1 of each building!'); return;
    }
    const n = buyAmount === 0 ? calcMaxBuy(name) : buyAmount;
    if (n <= 0) return;
    const cost = n === 1
        ? Math.floor(b.baseCost * Math.pow(b.priceRatio, b.count) * getGlobalMultiplier("cost", null))
        : getBulkCost(name, n);
    if (gameState.resources.clicks < cost) return;
    if (window.audioController) window.audioController.playBuy();
    gameState.resources.clicks -= cost;
    b.count += n;
    if (!gameState.stats) gameState.stats = {};
    gameState.stats.buildingsBought = (gameState.stats.buildingsBought || 0) + n;
    if (window.mapEngine && b.icon) window.mapEngine.addBuilding(name, b.icon);
    checkQuestProgress('purchases', n);
    const btn = document.getElementById('btn-'+name);
    if (btn) {
        const r = btn.getBoundingClientRect();
        spawnFloatingText(r.left + r.width/2, r.top, '-'+formatNumber(cost)+' 🖱️', '#e74c3c');
    }
    updateUI(); updateQuestUI();
};

function calculateProduction(state, dt = 0, applyCosts = false) {
    let production = 0;

    // Core Clicks Production
    const clickProducers = ["AutoClicker", "Gatherer", "LumberCamp", "Farm", "Mine", "Workshop", "Aqueduct", "Factory", "PowerPlant", "FusionReactor"];

    clickProducers.forEach(key => {
        if (state.buildings[key]) {
            const b = state.buildings[key];
            let efficiency = 1.0;

            // Apply Upkeep
            if (b.upkeep && dt > 0) {
                let minEff = 1.0;
                for (let res in b.upkeep) {
                    const req = b.upkeep[res] * b.count * dt;
                    if (req > 0) {
                        const avail = state.resources[res] || 0;
                        if (avail < req) {
                            minEff = Math.min(minEff, avail / req);
                        }
                    }
                }
                efficiency = minEff;

                if (applyCosts) {
                    for (let res in b.upkeep) {
                        const req = b.upkeep[res] * b.count * dt;
                        const consume = req * efficiency;
                        if (state.resources[res] !== undefined) {
                            state.resources[res] = Math.max(0, state.resources[res] - consume);
                        }
                    }
                }
            }

            // Produce Clicks (with milestone + upgrade multipliers)
            const _ms = getBuildingMilestoneMult(b.count);
            const _up = getBuildingUpgradeMult(key);
            production += b.count * b.production * efficiency * _ms * _up;

            // Produce Unique Resources (Population logic is separate)
            if (applyCosts && b.produces) {
                for (let res in b.produces) {
                    const amount = b.produces[res] * b.count * dt * efficiency;
                    if (state.resources[res] !== undefined) {
                        const _sm = {"Stone Age":10000,"Bronze Age":50000,"Iron Age":200000,"Middle Ages":500000,"Renaissance":1000000,"Industrial Age":5000000,"Modern Age":20000000,"Information Age":100000000,"Future Age":1000000000};
                        const max = _sm[state.era] || 10000;
                        state.resources[res] = Math.min(max, state.resources[res] + amount);
                    }
                }
            }
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

    // Production
    const currentProduction = calculateProduction(gameState, dt, true);

    // Knowledge — base 0.1/s + tech flat bonuses + buildings
    let knowledgeProd = 0.1;
    (gameState.researched||[]).forEach(id => {
        const t = (window.allResearch||[]).find(x=>x.id===id);
        if (t && t.effect && t.effect.type === "knowledge_flat") knowledgeProd += t.effect.value;
    });
    if (gameState.buildings["University"])    knowledgeProd += gameState.buildings["University"].count    * gameState.buildings["University"].production;
    if (gameState.buildings["Lab"])           knowledgeProd += gameState.buildings["Lab"].count           * gameState.buildings["Lab"].production;
    if (gameState.buildings["Supercomputer"]) knowledgeProd += gameState.buildings["Supercomputer"].count * gameState.buildings["Supercomputer"].production;
    knowledgeProd *= getGlobalMultiplier("production_mult", "knowledge");

    // Culture — base 0.05/s + tech flat bonuses
    let cultureProd = 0.05;
    (gameState.researched||[]).forEach(id => {
        const t = (window.allResearch||[]).find(x=>x.id===id);
        if (t && t.effect && t.effect.type === "culture_flat") cultureProd += t.effect.value;
    });
    cultureProd *= getGlobalMultiplier("production_mult", "culture");
    gameState.resources.culture = (gameState.resources.culture||0) + cultureProd * dt;

    // Money
    let moneyProd = 0;
    if (gameState.buildings["Bank"]) moneyProd += gameState.buildings["Bank"].count * gameState.buildings["Bank"].production;
    moneyProd *= getGlobalMultiplier("production_mult", "money");

    // Population Growth Logic
    // Max Pop = Base 10 + Housing from buildings
    let _techHousing = 0;
    (gameState.researched||[]).forEach(id => {
        const t = (window.allResearch||[]).find(x=>x.id===id);
        if (t && t.effect && t.effect.type==="housing_bonus") _techHousing += t.effect.value;
    });
    const housing = 10 + _techHousing +
        (gameState.buildings["Gatherer"].count * 2) +
        (gameState.buildings["Farm"].count * 5) +
        (gameState.buildings["Aqueduct"].count * 20);

    // Growth consumes Food
    const pop = gameState.resources.population;
    if (pop < housing) {
        // Growth rate: 10% of current pop per sec, capped by food
        const growthPotential = Math.max(1, pop * 0.1) * dt;
        const foodCost = growthPotential * 2; // 2 Food per new person

        if (gameState.resources.food >= foodCost) {
            gameState.resources.food -= foodCost;
            gameState.resources.population += growthPotential;
        }
    } else if (pop > housing) {
        // Overpopulation decay
        gameState.resources.population -= (pop - housing) * 0.1 * dt;
    }

    // Space Production
    const spaceProd = getSpaceProduction(gameState);
    const moneyMult = getGlobalMultiplier("production_mult", "money");
    const knowlMult = getGlobalMultiplier("production_mult", "knowledge");

    // Apply space resources
    for (let res in spaceProd) {
        let val = spaceProd[res] * dt;
        if (res === "money") val *= moneyMult;
        else if (res === "knowledge") val *= knowlMult;

        if (gameState.resources[res] !== undefined) {
            if (["money", "knowledge", "clicks", "culture"].includes(res)) {
                gameState.resources[res] += val;
            } else {
                const _eraStorageMap = {"Stone Age":10000,"Bronze Age":50000,"Iron Age":200000,"Middle Ages":500000,"Renaissance":1000000,"Industrial Age":5000000,"Modern Age":20000000,"Information Age":100000000,"Future Age":1000000000};
    const max = _eraStorageMap[gameState.era] || 10000;
                gameState.resources[res] = Math.min(max, gameState.resources[res] + val);
            }
        }
    }

    // Add produced currencies
    gameState.resources.clicks += currentProduction * dt;
    gameState.resources.lifetimeClicks += currentProduction * dt;
    gameState.resources.knowledge += knowledgeProd * dt;
    gameState.resources.money += moneyProd * dt;

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

    // Battle Loop
    if (gameState.battle && gameState.battle.active) {
        updateBattle(gameState, dt);
        if (!gameState.battle.active) {
            applyWarEconomy(false);
        }
    }

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

    // Expedition Progress
    if (gameState.activeExpeditions) {
        [...gameState.activeExpeditions].forEach((exp, index) => {
            exp.progress += dt;
            if (exp.progress >= exp.duration) {
                // Ensure completeExpedition is defined before calling
                if (typeof completeExpedition === 'function') {
                    completeExpedition(exp);
                } else if (window.completeExpedition) {
                    window.completeExpedition(exp);
                }
            }
        });
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

    // Achievements
    if (Math.random() < 0.1) {
        const newUnlocks = checkAchievements(gameState);
        if (newUnlocks.length > 0) {
            newUnlocks.forEach(ach => {
                showAchievementToast(ach);
                if (window.audioController) window.audioController.playEvent();
            });
        }
    }
}


// ─── MODAL ESC + BACKDROP CLOSE ──────────────────────────────────────────────
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close topmost closeable modal
        const closeable = ['story-modal', 'challenge-modal', 'ascension-modal'];
        for (const id of closeable) {
            const el = document.getElementById(id);
            if (el) { document.body.removeChild(el); return; }
        }
    }
});

// Backdrop click on event-modal should NOT auto-close (player must pick an option)
// But story/challenge/ascension modals can close on backdrop click
['story-modal', 'challenge-modal', 'ascension-modal'].forEach(id => {
    // Wired dynamically when modal is opened — see patchModalBackdrop()
});

function patchModalBackdrop(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    el.addEventListener('click', function(e) {
        if (e.target === el) {  // clicked backdrop, not content
            document.body.removeChild(el);
        }
    });
}

window.renderStoryModal = function() {
    if (document.getElementById("story-modal")) return;

    const modal = document.createElement("div");
    modal.id = "story-modal";
    modal.className = "modal-overlay";

    // Content based on Era
    let title = gameState.era;
    let desc = "The story of your civilization...";

    if (title === "Stone Age") desc = "Your tribe wanders the wilderness, gathering berries and hunting wild beasts. The first sparks of consciousness ignite.";
    if (title === "Bronze Age") desc = "Metalworking changes everything. City-states rise from the dust, and the first empires are born.";
    if (title === "Iron Age") desc = "Tools of war and agriculture become stronger. The world connects through conquest and trade.";
    if (title === "Middle Ages") desc = "Knights and castles dominate the land. Faith and feudalism bind society together.";
    if (title === "Renaissance") desc = "Art, science, and exploration flourish. The old ways are questioned as new horizons open.";
    if (title === "Industrial Age") desc = "Steam and steel drive the engines of progress. Factories rise, and the world shrinks.";
    if (title === "Modern Age") desc = "Electricity, flight, and the atom. Humanity reaches for the stars.";
    if (title === "Information Age") desc = "Data flows like water. The world is a global village connected by light.";
    if (title === "Future Age") desc = "Beyond the boundaries of Earth. The cosmos awaits.";

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h2>📜 Chronicles of the ${title}</h2>
            <p style="font-size: 1.1em; line-height: 1.6; margin: 20px 0;">${desc}</p>
            <button onclick="document.body.removeChild(document.getElementById('story-modal'))" style="background: #c0392b;">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
};

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
            <div style="margin-top:8px;text-align:right">
                <small style="color:#555;font-size:10px">Press ESC or click outside to dismiss</small>
            </div>
        </div>
    `;

    // Allow backdrop click to dismiss event modal if ALL options are disabled
    setTimeout(() => {
        const m = document.getElementById('event-modal');
        if (!m) return;
        const allDisabled = Array.from(m.querySelectorAll('.event-option-btn')).every(b => b.disabled);
        if (allDisabled) {
            m.addEventListener('click', e => { if (e.target === m && document.getElementById('event-modal')) document.body.removeChild(m); });
        }
        // Also wire ESC
        m._escHandler = (e) => { if (e.key === 'Escape' && allDisabled && document.getElementById('event-modal')) { document.body.removeChild(m); document.removeEventListener('keydown', m._escHandler); }};
        document.addEventListener('keydown', m._escHandler);
    }, 100);

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
        // Force Reactivity
        if (window.renderQuestList) window.renderQuestList();
        else if (window.updateQuestUI) window.updateQuestUI();
    }
};

// --- Mechanics ---

function addGameLog(msg) {
    const log = document.getElementById("game-log");
    if (!log) return;
    const p = document.createElement("p");
    p.style.cssText = "margin:2px 0;font-size:11px;border-bottom:1px solid #2a2a2a;padding:2px 0";
    p.textContent = new Date().toLocaleTimeString("en",{hour12:false,hour:"2-digit",minute:"2-digit"}) + " " + msg;
    log.prepend(p);
    while (log.children.length > 60) log.removeChild(log.lastChild);
}

function getGlobalMultiplier(type, resource = null) {
    let mult = 1.0;
    // Relics & Crafted Items
    const allItems = [...(gameState.inventory || []), ...(gameState.craftedItems || [])];
    allItems.forEach(relic => {
        if (relic.effect.type === `${type}_boost` || (type === "production" && relic.effect.type === "production_multiplier")) {
             mult += (relic.effect.value / 100);
        }
        // Specific Cost Reduction
        if (type === "cost" && relic.effect.type === "cost_reduction") {
            mult -= (relic.effect.value / 100);
        }
    });
    // Prestige upgrades
    if (window.PRESTIGE_UPGRADES && gameState.prestigeUpgrades) {
        PRESTIGE_UPGRADES.forEach(up => {
            const lv = (gameState.prestigeUpgrades[up.id] && gameState.prestigeUpgrades[up.id].level)||0;
            if (!lv) return;
            const v = up.eff.val(lv);
            if (type==="click" && up.eff.type==="click_mult") mult *= v;
            if (type==="production" && up.eff.type==="prod_mult") mult *= v;
            if (type==="cost" && up.eff.type==="cost_reduction") mult *= v;
        });
    }

    // Techs — handle all effect types
    gameState.researched.forEach(techId => {
        const tech = allResearch.find(t => t.id === techId);
        if (!tech || !tech.effect) return;
        const e = tech.effect;
        // production multipliers
        if (e.type === "production_multiplier" && type === "production") mult *= e.value;
        if (e.type === "production_mult" && type === "production") mult *= e.value;
        if (e.type === "production_mult" && type === "production_mult" && (!resource || e.resource === resource || e.resource === "clicks")) mult *= e.value;
        // resource-specific multipliers
        if (e.type === "knowledge_mult" && type === "production_mult" && resource === "knowledge") mult *= e.value;
        if (e.type === "money_mult"     && type === "production_mult" && resource === "money")     mult *= e.value;
        if (e.type === "culture_mult"   && type === "production_mult" && resource === "culture")   mult *= e.value;
        // click multiplier
        if (e.type === "click_mult" && type === "click") mult *= e.value;
        // cost reduction
        if (e.type === "building_cost_reduction" && type === "cost") mult *= e.value;
        // army
        if (e.type === "army_mult" && type === "army") mult *= e.value;
        // upkeep reduction
        if (e.type === "upkeep_reduction" && type === "upkeep") mult *= e.value;
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
    const cps = calculateProduction(gameState, 0, false);

    // Track Max Production for Leaderboard
    if (!gameState.stats.maxProduction || cps > gameState.stats.maxProduction) {
        gameState.stats.maxProduction = cps;
    }

    // Base click: +1 per 5 buildings owned + 15% of CpS synergy
    const _totalB = Object.values(gameState.buildings).reduce((s,b)=>s+b.count,0);
    let clickValue = (1 + Math.floor(_totalB / 5)) + (cps * 0.15);
    clickValue += (gameState.inventory.length * 0.05); // small relic bonus

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
        spawnFloatingText(event.clientX, event.clientY, `+${formatNumber(clickValue)}`, isCrit ? "#e74c3c" : "#f1c40f");
    }

    checkQuestProgress("clicks", 1);

    if (Math.random() < 0.05) {
        gameState.resources.relicShards++;
        checkQuestProgress("shards", 1);
    }
    updateUI();
    // Force immediate quest UI update for responsiveness
    updateQuestUI();
};

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

    // Dynamic Cost Calculation
    let currentCost = Math.floor(b.baseCost * Math.pow(b.priceRatio, b.count));
    let finalCost = Math.floor(currentCost * costMult);

    if (gameState.resources.clicks >= finalCost) {
        if (window.audioController) window.audioController.playBuy();
        gameState.resources.clicks -= finalCost;

        // Float text on button
        const btn = document.getElementById(`btn-${name}`);
        if (btn) {
            const rect = btn.getBoundingClientRect();
            spawnFloatingText(rect.left + rect.width/2, rect.top, `-${formatNumber(finalCost)} 🖱️`, "#e74c3c");
        }

        b.count++;

        // Stats
        if (!gameState.stats) gameState.stats = {};
        if (!gameState.stats.buildingsBought) gameState.stats.buildingsBought = 0;
        gameState.stats.buildingsBought++;

        // Visuals
        if (window.mapEngine && b.icon) {
            window.mapEngine.addBuilding(name, b.icon);
        }

        checkQuestProgress("purchases", 1);
        updateUI();
        updateQuestUI();
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

            // Apply one-time effects
            const ef = tech.effect;
            if (ef) {
                if (ef.type === "unlock_tab") {
                    const tabEl = document.getElementById(ef.tab);
                    if (tabEl) { tabEl.style.removeProperty("display"); tabEl.style.display = "inline-block"; }
                    addGameLog("🔓 Unlocked: " + ef.tab.replace("tab-btn-","").toUpperCase());
                }
                if (ef.type === "unlock_space_tab") {
                    const spEl = document.getElementById("tab-btn-space");
                    if (spEl) { spEl.style.removeProperty("display"); spEl.style.display = "inline-block"; }
                    addGameLog("🚀 Space Exploration unlocked!");
                }
                if (ef.type === "building_unlock") addGameLog("🏗️ Building unlocked: " + ef.building);
                if (ef.type === "trigger_victory") setTimeout(() => { if (typeof renderVictoryModal === "function") renderVictoryModal(); }, 500);
            }
            addGameLog("🔬 Researched: " + tech.name + (tech.effectDesc ? " — " + tech.effectDesc : ""));

            updateUI();
            renderResearchTree();
            updateVisibility();
        }
    }
};

// --- Persistence ---
window.saveGame = function() {
    gameState.lastSaveTime = Date.now();
    localStorage.setItem("hc_web_save", JSON.stringify(gameState));
    if (currentUser && firebaseModule) {
        firebaseModule.saveToCloud(currentUser.uid, gameState);
    }
    console.log("Game Saved");
}

function loadGame() {
    // Load Meta (Endgame State)
    const meta = localStorage.getItem("hc_web_meta");
    if (meta) {
        try {
            const metaState = JSON.parse(meta);
            if (metaState.transcendenceCount) {
                gameState.stats.transcendenceCount = metaState.transcendenceCount;
            }
        } catch (e) {
            console.error("Failed to load meta", e);
        }
    }

    const save = localStorage.getItem("hc_web_save");
    if (save) {
        try {
            const savedState = JSON.parse(save);
            Object.assign(gameState, savedState);

            // Perform Migration
            migrateSaveData(gameState);

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

function migrateSaveData(state) {
    // Migration: Convert String eras to Numeric eras
    if (state.buildings) {
        Object.keys(state.buildings).forEach(key => {
            const b = state.buildings[key];
            if (typeof b.era === "string") {
                const idx = ERA_DATA.findIndex(e => e.name === b.era);
                if (idx !== -1) {
                    b.era = idx;
                    console.log(`Migrated ${key} era from "${b.era}" to ${idx}`);
                } else {
                    // Fallback map if exact name doesn't match
                    const fallbackMap = {
                        "Stone Age": 0, "Bronze Age": 1, "Iron Age": 2, "Middle Ages": 3,
                        "Renaissance": 4, "Industrial Age": 5, "Modern Age": 6,
                        "Information Age": 7, "Future Age": 8
                    };
                    if (fallbackMap[b.era] !== undefined) {
                        b.era = fallbackMap[b.era];
                    } else {
                        b.era = 99; // Hide if unknown
                    }
                }
            }
        });
    }
}

function calculateOfflineProgress(seconds) {
    if (seconds <= 0) return;

    const limit = 86400; // 24 hours
    const actualSeconds = Math.min(seconds, limit);

    // Efficiency: Base 0.5 * Ascension Bonus
    const ascMult = getAscensionMultiplier(gameState, "offline_boost", null);
    const efficiency = 0.5 * ascMult;

    // 1. Calculate Rates (Net Per Second)
    const net = {};
    const uncapped = ["clicks", "knowledge", "money", "culture"];

    // Base Clicks (Production)
    let clickProd = 0;
    const clickProducers = ["AutoClicker", "Gatherer", "LumberCamp", "Farm", "Mine", "Workshop", "Aqueduct", "Factory", "PowerPlant", "FusionReactor"];
    clickProducers.forEach(key => {
        if (gameState.buildings[key]) {
            clickProd += gameState.buildings[key].count * gameState.buildings[key].production;
        }
    });
    const clickMult = getGlobalMultiplier("production", "clicks");
    if (!net["clicks"]) net["clicks"] = 0;
    net["clicks"] += clickProd * clickMult;

    // Knowledge (University, Lab, Supercomputer)
    let knowProd = 0;
    if (gameState.buildings["University"]) knowProd += gameState.buildings["University"].count * gameState.buildings["University"].production;
    if (gameState.buildings["Lab"]) knowProd += gameState.buildings["Lab"].count * gameState.buildings["Lab"].production;
    if (gameState.buildings["Supercomputer"]) knowProd += gameState.buildings["Supercomputer"].count * gameState.buildings["Supercomputer"].production;

    // Space Yields
    const spaceProd = getSpaceProduction(gameState);
    knowProd += spaceProd.knowledge;

    const knowMult = getGlobalMultiplier("production_mult", "knowledge");
    if (!net["knowledge"]) net["knowledge"] = 0;
    net["knowledge"] += knowProd * knowMult;

    // Money (Bank + Space)
    let moneyProd = 0;
    if (gameState.buildings["Bank"]) moneyProd += gameState.buildings["Bank"].count * gameState.buildings["Bank"].production;
    moneyProd += spaceProd.money;

    const moneyMult = getGlobalMultiplier("production_mult", "money");
    if (!net["money"]) net["money"] = 0;
    net["money"] += moneyProd * moneyMult;

    // Building Upkeep & Production (Generic)
    for (let key in gameState.buildings) {
        const b = gameState.buildings[key];
        const count = b.count;
        if (count <= 0) continue;

        // Upkeep (Drain)
        if (b.upkeep) {
            for (let res in b.upkeep) {
                if (!net[res]) net[res] = 0;
                net[res] -= b.upkeep[res] * count;
            }
        }

        // Production (if defined in future)
        if (b.produces) {
            for (let res in b.produces) {
                if (!net[res]) net[res] = 0;
                net[res] += b.produces[res] * count;
            }
        }
    }

    // 2. Apply Changes
    const changes = {};
    let hasChange = false;

    for (let res in net) {
        if (net[res] === 0) continue;

        const totalChange = net[res] * actualSeconds * efficiency;
        changes[res] = totalChange;
        hasChange = true;

        if (gameState.resources[res] === undefined) gameState.resources[res] = 0;

        gameState.resources[res] += totalChange;

        // 3. Enforce Limits
        if (uncapped.includes(res)) {
            // Min 0
            if (gameState.resources[res] < 0) gameState.resources[res] = 0;
            // Lifetime Clicks tracking
            if (res === "clicks" && totalChange > 0) {
                gameState.resources.lifetimeClicks += totalChange;
            }
        } else {
            // Physical: Clamp [0, maxStorage]
            const _eraStorageMap = {"Stone Age":10000,"Bronze Age":50000,"Iron Age":200000,"Middle Ages":500000,"Renaissance":1000000,"Industrial Age":5000000,"Modern Age":20000000,"Information Age":100000000,"Future Age":1000000000};
    const max = _eraStorageMap[gameState.era] || 10000;
            gameState.resources[res] = Math.max(0, Math.min(max, gameState.resources[res]));
        }
    }

    // 4. Alert
    if (hasChange) {
        const timeStr = actualSeconds > 3600
            ? `${Math.floor(actualSeconds/3600)}h ${Math.floor((actualSeconds%3600)/60)}m`
            : `${Math.floor(actualSeconds)}s`;

        let msg = `Welcome back! You were offline for ${timeStr}.\n`;
        msg += `Efficiency: ${(efficiency * 100).toFixed(0)}%\n\n`;
        msg += `Gains/Losses:\n`;

        for (let res in changes) {
            const val = Math.floor(changes[res]);
            if (val === 0) continue;
            const sign = val > 0 ? "+" : "";
            msg += `${sign}${val} ${res}\n`;
        }
        alert(msg);
    }
}

// --- UI Updates ---
function initUI() {
    renderResearchTree();
    injectDynamicTabs();
    initAscensionUI();
}

function initAscensionUI() {
    const ascContainer = document.getElementById("ascension-list");
    if (!ascContainer) return;

    ascContainer.innerHTML = ""; // Clear initial placeholder

    // Challenge Button
    const chalBtn = document.createElement("button");
    chalBtn.id = "btn-challenge-menu";
    chalBtn.onclick = () => renderChallengeMenu();
    chalBtn.style.width = "100%";
    chalBtn.style.marginBottom = "10px";
    chalBtn.style.background = "#8e44ad";
    chalBtn.innerText = "⚔️ Challenge Modes";
    ascContainer.appendChild(chalBtn);

    // Active Challenge Label (Hidden by default)
    const activeChalDiv = document.createElement("div");
    activeChalDiv.id = "active-challenge-label";
    activeChalDiv.style.background = "#c0392b";
    activeChalDiv.style.padding = "5px";
    activeChalDiv.style.marginBottom = "10px";
    activeChalDiv.style.borderRadius = "4px";
    activeChalDiv.style.display = "none"; // Hidden initially
    ascContainer.appendChild(activeChalDiv);

    // Tree Button
    const treeBtn = document.createElement("button");
    treeBtn.id = "btn-ascension-tree";
    treeBtn.innerText = "Open Ascension Tree 🌌";
    treeBtn.style.width = "100%";
    treeBtn.style.background = "radial-gradient(circle, #8e44ad, #2c3e50)";
    treeBtn.onclick = () => renderAscensionTree();
    ascContainer.appendChild(treeBtn);

    // Stellar Map Button (Hidden by default)
    const starBtn = document.createElement("button");
    starBtn.id = "btn-stellar-map";
    starBtn.innerText = "Stellar Map ✨";
    starBtn.style.width = "100%";
    starBtn.style.marginTop = "5px";
    starBtn.style.background = "#000";
    starBtn.style.border = "1px solid #f1c40f";
    starBtn.onclick = () => renderConstellationMenu();
    starBtn.style.display = "none";
    ascContainer.appendChild(starBtn);
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

    // Ensure Expeditions view content is populated if empty
    const expView = document.getElementById("expeditions-view");
    if (expView) {
         // Render the dynamic list
         if (window.renderExpeditions) window.renderExpeditions();
    }

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
            storyBtn.onclick = () => window.renderStoryModal();
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
        if (gameState.resources.lifetimeClicks >= nextEra.threshold) {
            advanceEra(nextEra);
        }
    }
}

function updateVisibility() {
    const currentEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);

    // Feature unlocks — tabs open via ERA or specific TECH research
    const techUnlockedTabs = new Set();
    (gameState.researched || []).forEach(techId => {
        const tech = (window.allResearch || []).find(t => t.id === techId);
        if (!tech || !tech.effect) return;
        if (tech.effect.type === "unlock_tab") techUnlockedTabs.add(tech.effect.tab);
        if (tech.effect.type === "unlock_space_tab") techUnlockedTabs.add("tab-btn-space");
    });

    for (let id in FEATURE_UNLOCKS) {
        const req = FEATURE_UNLOCKS[id];
        const reqEraIdx = ERA_DATA.findIndex(e => e.name === req.era);
        const byEra  = currentEraIdx >= reqEraIdx;
        const byTech = techUnlockedTabs.has(id);
        const show   = byEra || byTech;

        const el = document.getElementById(id);
        if (el) {
            if (show) {
                if (el.style.display === "none" || el.style.display === "") {
                    el.style.removeProperty("display");
                    el.style.display = "inline-block";
                }
            } else {
                el.style.display = "none";
                el.style.setProperty("display", "none", "important");
                const viewId = id.replace("tab-btn-", "") + "-view";
                const viewEl = document.getElementById(viewId);
                if (viewEl) {
                    viewEl.style.display = "none";
                    viewEl.style.setProperty("display", "none", "important");
                }
                if (el.classList.contains("active")) showTab("research");
            }
        }
    }
    // Also check any extra tabs added dynamically
    techUnlockedTabs.forEach(tabId => {
        const el = document.getElementById(tabId);
        if (el && (el.style.display === "none" || el.style.display === "")) {
            el.style.removeProperty("display");
            el.style.display = "inline-block";
        }
    });

    // STRICT ERA GATING FOR BUILDINGS
    Object.keys(gameState.buildings).forEach(key => {
        const b = gameState.buildings[key];
        const btn = document.getElementById(`btn-${key}`);
        if (btn) {
            // Default to era 99 if missing to prevent rendering
            const buildingEra = (b.era !== undefined) ? b.era : 99;

            if (currentEraIdx >= buildingEra) {
                 if (btn.style.display === "none") {
                    btn.style.display = "flex"; // Re-enable display
                 }
            } else {
                 btn.style.display = "none";
            }
        }
    });

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

    // STRICT ERA 1 VISIBILITY FALLBACK (Explicit overrides)
    const clickBtn = document.getElementById("click-btn");
    if (clickBtn) clickBtn.style.display = "block";

    // Tech Root
    // Rendered via renderResearchTree, but ensure the tab is visible
    const resTab = document.getElementById("tab-btn-research");
    if (resTab) resTab.style.display = "inline-block";
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
                // Migrate
                migrateSaveData(gameState);
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
            // Migrate
            migrateSaveData(gameState);
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


// ─── PRESTIGE UPGRADE SYSTEM ──────────────────────────────────────────────────
const PRESTIGE_UPGRADES = [
    { id:"click_power",     name:"Click Power",       icon:"👆", max:10, cost:1, desc:l=>`+${l*25}% click value`,       eff:{type:"click_mult",      val:l=>1+l*0.25} },
    { id:"cps_boost",       name:"Auto Production",   icon:"⚙️", max:10, cost:1, desc:l=>`+${l*20}% building output`,   eff:{type:"prod_mult",       val:l=>1+l*0.20} },
    { id:"start_clicks",    name:"Head Start",        icon:"🚀", max:5,  cost:2, desc:l=>`Start with ${l*500} clicks`,  eff:{type:"start_bonus",     val:l=>l*500}    },
    { id:"golden_freq",     name:"Golden Relics",     icon:"✨", max:10, cost:1, desc:l=>`+${l*10}% golden chance`,     eff:{type:"golden_chance",   val:l=>l*0.002}  },
    { id:"cost_reduce",     name:"Cheap Buildings",   icon:"💸", max:5,  cost:2, desc:l=>`-${l*8}% build costs`,        eff:{type:"cost_reduction",  val:l=>1-l*0.08} },
    { id:"knowledge_boost", name:"Enlightenment",     icon:"🧠", max:10, cost:2, desc:l=>`+${l*30}% knowledge`,         eff:{type:"know_mult",       val:l=>1+l*0.30} },
    { id:"culture_boost",   name:"Cultural Legacy",   icon:"🎭", max:10, cost:2, desc:l=>`+${l*30}% culture`,           eff:{type:"cult_mult",       val:l=>1+l*0.30} },
    { id:"prestige_gain",   name:"Historian",         icon:"📜", max:5,  cost:5, desc:l=>`+${l*20}% SE from prestige`,  eff:{type:"prestige_gain",   val:l=>1+l*0.20} },
];

function renderPrestigePanel() {
    const container = document.getElementById("prestige-upgrades");
    if (!container) return;
    if (!gameState.prestigeUpgrades) gameState.prestigeUpgrades = {};
    const se = gameState.resources.se || 0;

    let html = `<div style="margin:4px 0;color:#f39c12;font-weight:bold">🌟 SE available: ${se}</div>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">`;
    PRESTIGE_UPGRADES.forEach(up => {
        const lv = (gameState.prestigeUpgrades[up.id] && gameState.prestigeUpgrades[up.id].level) || 0;
        const maxed = lv >= up.max;
        const canBuy = !maxed && se >= up.cost;
        html += `<div style="background:${maxed?'#1a3a1a':canBuy?'#2a1a4a':'#222'};border:1px solid ${maxed?'#2ecc71':canBuy?'#8e44ad':'#444'};border-radius:6px;padding:6px 8px;min-width:130px;font-size:11px;text-align:center">
            <div style="font-size:18px">${up.icon}</div>
            <div style="font-weight:bold;color:#eee">${up.name}</div>
            <div style="color:#888;font-size:10px">Lv ${lv}/${up.max}</div>
            <div style="color:#7ec8e3;font-size:10px;margin:2px 0">${lv>0?up.desc(lv):'—'}</div>
            ${maxed
                ? `<div style="color:#2ecc71">✅ MAXED</div>`
                : `<div style="color:#f1c40f;font-size:10px">Next: ${up.desc(lv+1)}</div>
                   <button onclick="window.buyPrestigeUpgradeNew('${up.id}')"
                     style="margin-top:4px;width:100%;padding:2px 0;background:${canBuy?'#8e44ad':'#444'};color:#fff;border:none;border-radius:3px;cursor:${canBuy?'pointer':'default'};font-size:10px"
                   >${canBuy?`Buy (${up.cost} SE)`:`Need ${up.cost} SE`}</button>`
            }
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}
window.buyPrestigeUpgradeNew = function(id) {
    const up = PRESTIGE_UPGRADES.find(u=>u.id===id);
    if (!up) return;
    if (!gameState.prestigeUpgrades) gameState.prestigeUpgrades = {};
    const lv = (gameState.prestigeUpgrades[id] && gameState.prestigeUpgrades[id].level) || 0;
    if (lv >= up.max) return;
    if ((gameState.resources.se||0) < up.cost) return;
    gameState.resources.se -= up.cost;
    gameState.prestigeUpgrades[id] = { level: lv+1 };
    renderPrestigePanel();
    updateUI();
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

    // Reset Buildings & Costs (STRICT NUMERIC ERAS)
    gameState.buildings = {
        "AutoClicker": { count: 0, baseCost: 15, priceRatio: 1.15, production: 0.5, icon: "👆", era: 0 },
        "Gatherer": { count: 0, baseCost: 50, priceRatio: 1.15, production: 1, icon: "🧺", era: 0 },
        "Farm": { count: 0, baseCost: 250, priceRatio: 1.15, production: 3, icon: "🌾", era: 1 },
        "Mine": { count: 0, baseCost: 1000, priceRatio: 1.20, production: 10, icon: "⛏️", era: 1, upkeep: { wood: 1 } },
        "Workshop": { count: 0, baseCost: 5000, priceRatio: 1.20, production: 25, icon: "🔨", era: 2, upkeep: { stone: 2 } },
        "Aqueduct": { count: 0, baseCost: 15000, priceRatio: 1.25, production: 50, icon: "💧", era: 2 },
        "University": { count: 0, baseCost: 50000, priceRatio: 1.25, production: 100, icon: "🎓", era: 3 },
        "Bank": { count: 0, baseCost: 250000, priceRatio: 1.30, production: 250, icon: "🏦", era: 4 },
        "Factory": { count: 0, baseCost: 1000000, priceRatio: 1.30, production: 800, icon: "🏭", era: 5, upkeep: { iron: 2, energy: 5 } },
        "Lab": { count: 0, baseCost: 5000000, priceRatio: 1.35, production: 1500, icon: "🔬", era: 6 },
        "PowerPlant": { count: 0, baseCost: 25000000, priceRatio: 1.40, production: 5000, icon: "⚡", era: 6, upkeep: { wood: 5 } },
        "Supercomputer": { count: 0, baseCost: 100000000, priceRatio: 1.45, production: 20000, icon: "🖥️", era: 7 },
        "FusionReactor": { count: 0, baseCost: 1000000000, priceRatio: 1.50, production: 100000, icon: "⚛️", era: 8 }
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

function initBuildingsUI() {
    const list = document.getElementById("building-list");
    if (!list) return;

    list.innerHTML = "";

    // Get current era index for STRICT INITIAL RENDER GATING
    const currentEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);

    Object.keys(gameState.buildings).forEach(name => {
        const b = gameState.buildings[name];

        const btn = document.createElement("button");
        btn.id = `btn-${name}`;
        btn.className = "building-btn";
        // Inline style for layout
        btn.style.width = "100%";
        btn.style.marginBottom = "5px";
        btn.style.padding = "10px";

        // RENDER-LEVEL GATING: Set initial display state
        // Default to era 99 if missing
        const buildingEra = (b.era !== undefined) ? b.era : 99;
        if (currentEraIdx >= buildingEra) {
            btn.style.display = "flex";
        } else {
            btn.style.display = "none";
        }

        btn.style.alignItems = "center";
        btn.style.textAlign = "left";
        btn.style.justifyContent = "flex-start";
        btn.style.gap = "10px";

        let upkeepHtml = "";
        if (b.upkeep) {
            let parts = [];
            for (let res in b.upkeep) {
                parts.push(`${b.upkeep[res]} ${res}`);
            }
            upkeepHtml = `<br><small style="color:#e74c3c">Upkeep: ${parts.join(", ")}</small>`;
        }

        // Produces Text
        let prodText = "";
        if (b.produces) {
            for (let res in b.produces) {
                prodText += `${b.produces[res]} ${res} `;
            }
        }

        // Initial text, updated dynamically in renderBuildings
        btn.innerHTML = `
            <div style="font-size:24px;">${b.icon}</div>
            <div>
                <strong>Buy ${name}</strong><br>
                <small>Cost: <span id="cost-${name}">0</span></small> | <small>Owned: <span id="count-${name}">0</span></small><br>
                <small id="prod-text-${name}">Prod: ${b.production} Click</small>
                <span id="upg-${name}" style="display:inline-block"></span>
                ${prodText ? `<br><small style="color:#2ecc71">Produces: ${prodText}</small>` : ''}
                ${upkeepHtml}
            </div>
        `;
        btn.onclick = () => window.buyBuilding(name);

        list.appendChild(btn);
    });
}

function renderBuildings(container) {
    // DOM Recycling: Update existing elements instead of clearing innerHTML
    const buildingKeys = Object.keys(gameState.buildings);

    buildingKeys.forEach(name => {
        const b = gameState.buildings[name];

        let currentCost = Math.floor(b.baseCost * Math.pow(b.priceRatio, b.count));
        let costMult = getGlobalMultiplier("cost", null);
        const finalCost = Math.floor(currentCost * costMult);

        const countEl = document.getElementById(`count-${name}`);
        if (countEl) countEl.innerText = b.count;

        // Cost display: shows bulk cost if buyAmount > 1
        const costEl = document.getElementById(`cost-${name}`);
        if (costEl) {
            const bAmt = buyAmount === 0 ? calcMaxBuy(name) : buyAmount;
            if (bAmt <= 1) {
                costEl.innerText = formatNumber(finalCost);
            } else {
                const bulk = getBulkCost(name, bAmt);
                costEl.innerText = `${formatNumber(bulk)} (×${bAmt})`;
            }
        }

        // Production text: real output with all multipliers
        const prodEl = document.getElementById(`prod-text-${name}`);
        if (prodEl) {
            const gMult = getGlobalMultiplier("production", "clicks");
            const msMult = getBuildingMilestoneMult(b.count);
            const upMult = getBuildingUpgradeMult(name);
            const effective = b.production * gMult * msMult * upMult;
            const total = effective * b.count;
            const next = getNextMilestone(b.count);
            const milestoneHint = next ? ` [×2@${next}]` : '';
            if (b.count > 0) {
                prodEl.innerText = `${formatNumber(effective)}/s each · ${formatNumber(total)}/s total${milestoneHint}`;
            } else {
                prodEl.innerText = `${b.production}/s each`;
            }
        }

        // Upgrade button
        const upgEl = document.getElementById(`upg-${name}`);
        if (upgEl) {
            const tier = (gameState.buildingUpgrades && gameState.buildingUpgrades[name]) || 0;
            const upgCost = getBuildingUpgradeCost(name, tier);
            const canUpg = gameState.resources.clicks >= upgCost;
            upgEl.innerHTML = `<button onclick="window.buyBuildingUpgrade('${name}')"
                style="margin-left:4px;padding:1px 6px;font-size:10px;background:${canUpg?'#8e44ad':'#444'};color:#fff;border:none;border-radius:3px;cursor:pointer"
                title="Doubles ${name} output (tier ${tier}→${tier+1}). Cost: ${formatNumber(upgCost)}"
            >⬆️×${Math.pow(2,tier+1)} (${formatNumber(upgCost)})</button>`;
        }

        const btn = document.getElementById(`btn-${name}`);
        if (btn) {
            const bAmt2 = buyAmount === 0 ? calcMaxBuy(name) : buyAmount;
            const chk = bAmt2 <= 1 ? finalCost : getBulkCost(name, bAmt2);
            btn.disabled = gameState.resources.clicks < chk;
            // Redirect onclick to bulk buy
            btn.onclick = () => window.buyBulkBuilding(name);
        }
    });
}

function updateUI() {
    updateVisibility(); // Strict Check
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

    document.getElementById("res-clicks").innerText = formatNumber(gameState.resources.clicks);

    // CpS + click power display
    const _cps = calculateProduction(gameState, 0, false);
    const _totalBs = Object.values(gameState.buildings).reduce((s,b)=>s+b.count,0);
    const _cp = Math.floor((1 + Math.floor(_totalBs/5)) + _cps * 0.15);
    const cpsEl = document.getElementById("res-cps");
    if (cpsEl) cpsEl.textContent = `${formatNumber(_cps)}/s  ·  ✋ ${formatNumber(_cp)}/click`;

    // Prestige upgrades panel
    if (typeof renderPrestigePanel === 'function') renderPrestigePanel();
    document.getElementById("res-knowledge").innerText = formatNumber(gameState.resources.knowledge);
    document.getElementById("res-culture").innerText = formatNumber(gameState.resources.culture);
    document.getElementById("res-shards").innerText = gameState.resources.relicShards;

    // Population UI
    const popEl = document.getElementById("res-population");
    if (popEl) {
        let _techHousingUI = 0;
        (gameState.researched||[]).forEach(id => {
            const t = (window.allResearch||[]).find(x=>x.id===id);
            if (t && t.effect && t.effect.type==="housing_bonus") _techHousingUI += t.effect.value;
        });
        const housing = 10 + _techHousingUI +
            (gameState.buildings["Gatherer"].count * 2) +
            (gameState.buildings["Farm"].count * 5) +
            (gameState.buildings["Aqueduct"].count * 20);
        popEl.innerText = `${Math.floor(gameState.resources.population)} / ${housing}`;
        popEl.title = "Population grows if Food > 0. Requires housing.";
    }

    // Loot resources
    const lootContainer = document.getElementById("loot-resources");
    if (lootContainer) {
        const resourceConfig = [
            { key: "population", icon: "👥", era: "Stone Age" },
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
                let val = formatNumber(gameState.resources[res.key]);
                if (res.key === "population") val = Math.floor(gameState.resources[res.key]);
                html += `<span>${res.icon} ${val}</span> | `;
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
    // (Logic moved to initAscensionUI to prevent DOM thrashing)
    const activeChalDiv = document.getElementById("active-challenge-label");
    if (activeChalDiv) {
        if (gameState.activeChallenge) {
            const c = CHALLENGES.find(x => x.id === gameState.activeChallenge);
            activeChalDiv.style.display = "block";
            activeChalDiv.innerText = `ACTIVE: ${c ? c.name : 'Unknown'}`;
        } else {
            activeChalDiv.style.display = "none";
        }
    }

    const starBtn = document.getElementById("btn-stellar-map");
    if (starBtn) {
        if (gameState.era === "Future Age" || (gameState.space && gameState.space.planets.length > 0)) {
            starBtn.style.display = "block";
        } else {
            starBtn.style.display = "none";
        }
    }

    // ── Re-render active tab panels ──────────────────────────────────────
    const activeView = document.querySelector(".tab-view[style*='block'], .tab-view.active");
    const activeId = activeView ? activeView.id : "";
    if (activeId === "expeditions-view")  renderExpeditions();
    if (activeId === "crafting-view")     renderCrafting();
    if (activeId === "war-view")          renderWar();
    if (activeId === "heroes-view")       renderHeroes();
    if (activeId === "government-view")   renderGovernment();
    if (activeId === "achievements-view") renderAchievements();
}

window.renderResearchTree = function() {
    const container = document.getElementById("research-container");
    if (!container) return;

    // ── PAN / DRAG ────────────────────────────────────────────────
    if (!container._panWired) {
        container._panWired = true;
        let dragging = false, sx, sy, sl, st;
        container.addEventListener("mousedown", e => {
            // Don't hijack button clicks
            if (e.target.tagName === "BUTTON") return;
            dragging = true;
            container.style.cursor = "grabbing";
            sx = e.pageX; sy = e.pageY;
            sl = container.scrollLeft; st = container.scrollTop;
        });
        window.addEventListener("mouseup",   () => { dragging = false; container.style.cursor = "grab"; });
        container.addEventListener("mousemove", e => {
            if (!dragging) return;
            e.preventDefault();
            container.scrollLeft = sl - (e.pageX - sx);
            container.scrollTop  = st - (e.pageY - sy);
        });
        // Touch support
        let tx, ty, tsl, tst;
        container.addEventListener("touchstart", e => {
            const t = e.touches[0];
            tx = t.pageX; ty = t.pageY;
            tsl = container.scrollLeft; tst = container.scrollTop;
        }, { passive: true });
        container.addEventListener("touchmove", e => {
            const t = e.touches[0];
            container.scrollLeft = tsl - (t.pageX - tx);
            container.scrollTop  = tst - (t.pageY - ty);
        }, { passive: true });
    }

    // ── LAYOUT CONSTANTS ─────────────────────────────────────────
    const COL_W    = 180;  // horizontal gap between eras
    const NODE_W   = 140;  // matches CSS
    const NODE_H   = 88;   // min-height
    const ROW_H    = 108;  // vertical spacing between nodes
    const TOP_PAD  = 36;   // room for era label
    const LEFT_PAD = 20;

    // Group techs by era, preserving ERA_DATA order
    const byEra = {};
    ERA_DATA.forEach(e => byEra[e.name] = []);
    (window.allResearch || []).forEach(t => {
        if (byEra[t.era]) byEra[t.era].push(t);
        else {
            const last = ERA_DATA[ERA_DATA.length - 1].name;
            byEra[last].push(t);
        }
    });

    // ── COMPUTE POSITIONS ────────────────────────────────────────
    const pos = {};  // techId → {x, y}
    let colIdx = 0;
    ERA_DATA.forEach(era => {
        const techs = byEra[era.name] || [];
        techs.forEach((tech, row) => {
            pos[tech.id] = {
                x: LEFT_PAD + colIdx * (COL_W + NODE_W),
                y: TOP_PAD + row * ROW_H
            };
        });
        if (techs.length > 0) colIdx++;
    });

    const totalW = colIdx * (COL_W + NODE_W) + LEFT_PAD + 40;
    const totalH = Math.max(...Object.values(pos).map(p => p.y)) + NODE_H + 40;

    // ── CLEAR & SET SIZE ─────────────────────────────────────────
    container.innerHTML = "";
    container.style.position = "relative";
    // Inner canvas so container overflow:auto works
    const canvas = document.createElement("div");
    canvas.style.cssText = `position:relative;width:${totalW}px;height:${totalH}px;`;
    container.appendChild(canvas);

    // ── SVG FOR LINES ────────────────────────────────────────────
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.cssText = `position:absolute;top:0;left:0;width:${totalW}px;height:${totalH}px;pointer-events:none;z-index:1`;
    canvas.appendChild(svg);

    // ── ERA LABELS ───────────────────────────────────────────────
    let eraColIdx = 0;
    ERA_DATA.forEach(era => {
        const techs = byEra[era.name] || [];
        if (!techs.length) return;
        const lbl = document.createElement("div");
        lbl.className = "era-label";
        lbl.textContent = era.name;
        lbl.style.left = (LEFT_PAD + eraColIdx * (COL_W + NODE_W)) + "px";
        canvas.appendChild(lbl);
        eraColIdx++;
    });

    // ── RENDER NODES ─────────────────────────────────────────────
    const isDoneMap   = new Set(gameState.researched);
    const isReqMetMap = {};
    (window.allResearch || []).forEach(t => {
        isReqMetMap[t.id] = t.requirements.every(r => isDoneMap.has(r));
    });

    (window.allResearch || []).forEach(tech => {
        const p = pos[tech.id];
        if (!p) return;

        const isDone  = isDoneMap.has(tech.id);
        const reqMet  = isReqMetMap[tech.id];
        const visible = isDone || reqMet || tech.requirements.some(r => isDoneMap.has(r));

        if (!visible && tech.requirements.length > 0) return; // hide completely unknown

        const isAvail = reqMet && !isDone;
        const isLocked = !reqMet && !isDone;

        const node = document.createElement("div");
        node.id = `tech-node-${tech.id}`;
        node.className = `tech-node ${isDone ? "researched" : isAvail ? "available" : "locked"}`;
        node.style.cssText = `left:${p.x}px;top:${p.y}px;width:${NODE_W}px;`;

        const cost = tech.costType === "culture"
            ? `${formatNumber(tech.cost)} 🎭`
            : `${formatNumber(tech.cost)} 🧠`;

        node.innerHTML = `
            <span style="font-size:18px">${tech.icon || "🔬"}</span>
            <div style="font-weight:bold;margin:2px 0;font-size:11px">${tech.name}</div>
            ${isDone
                ? `<div style="color:#2ecc71;font-size:10px">✅ Done</div>`
                : `<div style="color:#aaa;font-size:9px">${cost}</div>`
            }
            <div class="eff-desc">${tech.effectDesc || ""}</div>
            ${isAvail ? `<button class="buy-btn" onclick="window.buyResearch('${tech.id}')">Research</button>` : ""}
            ${isLocked ? `<div style="font-size:16px">🔒</div>` : ""}
        `;

        node.title = [
            tech.name,
            tech.description || "",
            `Effect: ${tech.effectDesc || "?"}`,
            `Cost: ${formatNumber(tech.cost)} ${tech.costType}`,
            tech.requirements.length ? `Requires: ${tech.requirements.join(", ")}` : ""
        ].filter(Boolean).join("\n");

        canvas.appendChild(node);
    });

    // ── DRAW LINES (after DOM paint) ─────────────────────────────
    requestAnimationFrame(() => {
        svg.innerHTML = "";
        (window.allResearch || []).forEach(tech => {
            if (!pos[tech.id]) return;
            const isDone = isDoneMap.has(tech.id);
            const visible = isDoneMap.has(tech.id) || isReqMetMap[tech.id]
                || tech.requirements.some(r => isDoneMap.has(r));
            if (!visible && tech.requirements.length > 0) return;

            tech.requirements.forEach(reqId => {
                if (!pos[reqId]) return;
                const fromP = pos[reqId];
                const toP   = pos[tech.id];

                // Line from right-center of parent to left-center of child
                const x1 = fromP.x + NODE_W;
                const y1 = fromP.y + NODE_H / 2;
                const x2 = toP.x;
                const y2 = toP.y + NODE_H / 2;
                const mx = (x1 + x2) / 2;

                const reqDone = isDoneMap.has(reqId);
                const color   = (reqDone && isDone) ? "#2ecc71" : reqDone ? "#3498db" : "#444";

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
                path.setAttribute("fill", "none");
                path.setAttribute("stroke", color);
                path.setAttribute("stroke-width", "2");
                path.style.pointerEvents = "none";
                svg.appendChild(path);
            });
        });
    });
};


// --- Victory & Endgame ---


// ─── CRAFTING ──────────────────────────────────────────────────────────────
function renderCrafting() {
    const list = document.getElementById("recipe-list");
    if (!list) return;

    const recipes = window.allRecipes || [];
    if (recipes.length === 0) {
        list.innerHTML = "<p style='color:#888'>No recipes yet. Research crafting technologies.</p>";
        return;
    }

    // Filter by era
    const curEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);
    const available = recipes.filter(r => {
        const reqIdx = ERA_DATA.findIndex(e => e.name === (r.era || "Stone Age"));
        return curEraIdx >= reqIdx;
    });

    list.innerHTML = "";
    available.forEach(recipe => {
        const owned = (gameState.craftedItems || []).filter(i => i.id === recipe.id).length;
        const costStr = Object.entries(recipe.cost || {}).map(([k,v]) => `${formatNumber(v)} ${k}`).join(", ");
        const canAfford = Object.entries(recipe.cost || {}).every(([k,v]) => (gameState.resources[k]||0) >= v);

        const div = document.createElement("div");
        div.style.cssText = "border:1px solid #555;padding:10px;margin-bottom:8px;background:rgba(0,0,0,0.3);border-radius:6px;display:flex;justify-content:space-between;align-items:center";
        div.innerHTML = `
            <div>
                <div style="font-weight:bold">${recipe.icon||"⚒️"} ${recipe.name} ${owned>0?`<span style='color:#2ecc71;font-size:10px'>(×${owned})</span>`:""}</div>
                <div style="font-size:11px;color:#aaa">${recipe.description||recipe.effectDesc||""}</div>
                <div style="font-size:11px">Cost: ${costStr}</div>
            </div>
            <button onclick="window.craftItem('${recipe.id}')"
                style="padding:4px 12px;background:${canAfford?'#8e44ad':'#444'};color:#fff;border:none;border-radius:4px;cursor:${canAfford?'pointer':'default'};white-space:nowrap"
                ${canAfford?'':'disabled'}>
                ${canAfford ? "Craft" : "Need resources"}
            </button>
        `;
        list.appendChild(div);
    });
}

window.craftItem = function(recipeId) {
    const recipe = (window.allRecipes || []).find(r => r.id === recipeId);
    if (!recipe) return;
    for (let res in (recipe.cost||{})) {
        if ((gameState.resources[res]||0) < recipe.cost[res]) {
            addGameLog("❌ Not enough " + res + " to craft " + recipe.name); return;
        }
    }
    for (let res in (recipe.cost||{})) gameState.resources[res] -= recipe.cost[res];
    if (!gameState.craftedItems) gameState.craftedItems = [];
    gameState.craftedItems.push({ ...recipe, id: recipe.id });
    if (!gameState.stats) gameState.stats = {};
    gameState.stats.itemsCrafted = (gameState.stats.itemsCrafted || 0) + 1;
    addGameLog("⚒️ Crafted: " + recipe.name + " — " + (recipe.effectDesc||""));
    renderCrafting();
    updateUI();
};


// ─── WAR ───────────────────────────────────────────────────────────────────
function renderWar() {
    const unitList = document.getElementById("unit-list");
    const rivalList = document.getElementById("rival-list");
    const armyPow = document.getElementById("army-power");
    if (!gameState.army) gameState.army = {};

    const curEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);

    // Army power
    const power = calculateArmyPower(gameState.army);
    if (armyPow) armyPow.textContent = "⚔️ Army Power: " + formatNumber(power);

    // Units
    if (unitList) {
        unitList.innerHTML = "";
        Object.entries(UNITS).forEach(([key, unit]) => {
            const unitEraIdx = ERA_DATA.findIndex(e => e.name === (unit.era||"Stone Age"));
            if (curEraIdx < unitEraIdx) return;
            const owned = gameState.army[key] || 0;
            const costStr = Object.entries(unit.cost||{}).map(([k,v])=>`${formatNumber(v)} ${k}`).join(", ");
            const canAfford = Object.entries(unit.cost||{}).every(([k,v])=>(gameState.resources[k]||0)>=v);
            const div = document.createElement("div");
            div.style.cssText = "border:1px solid #555;padding:8px;margin-bottom:6px;background:rgba(0,0,0,0.3);border-radius:5px;display:flex;justify-content:space-between;align-items:center";
            div.innerHTML = `
                <div>
                    <span style="font-size:18px">${unit.icon}</span>
                    <strong> ${unit.name}</strong>
                    <span style="font-size:10px;color:#888"> (owned: ${owned})</span><br>
                    <span style="font-size:11px">ATK:${unit.attack} HP:${unit.health} · ${costStr}</span>
                </div>
                <button onclick="window.trainUnit('${key}')"
                    style="padding:3px 10px;background:${canAfford?'#c0392b':'#444'};color:#fff;border:none;border-radius:3px;cursor:${canAfford?'pointer':'default'}"
                    ${canAfford?'':'disabled'}>Train</button>
            `;
            unitList.appendChild(div);
        });
    }

    // Rivals
    if (rivalList) {
        rivalList.innerHTML = "";
        RIVALS.forEach((rival, idx) => {
            const lootStr = Object.entries(rival.loot||{}).map(([k,v])=>`${formatNumber(v)} ${k}`).join(", ");
            const canFight = power > 0 && !gameState.battle?.active;
            const div = document.createElement("div");
            div.style.cssText = "border:1px solid #7f8c8d;padding:8px;margin-bottom:6px;background:rgba(0,0,0,0.3);border-radius:5px";
            div.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <strong>⚔️ ${rival.name}</strong><br>
                        <span style="font-size:11px">Power: ${formatNumber(rival.power)} · Loot: ${lootStr}</span>
                    </div>
                    <button onclick="window.attackRival(${idx})"
                        style="padding:3px 10px;background:${canFight?'#c0392b':'#555'};color:#fff;border:none;border-radius:3px;cursor:${canFight?'pointer':'default'}"
                        ${canFight?'':'disabled'}>Attack</button>
                </div>
            `;
            rivalList.appendChild(div);
        });
        // Battle status
        if (gameState.battle?.active) {
            const b = gameState.battle;
            const pct = Math.round((b.playerPower / (b.playerPower + b.rivalPower + 0.001)) * 100);
            const bDiv = document.createElement("div");
            bDiv.style.cssText = "border:2px solid #e74c3c;padding:10px;margin-top:10px;border-radius:6px;background:rgba(231,76,60,0.1)";
            bDiv.innerHTML = `
                <strong>🔥 BATTLE IN PROGRESS: ${b.rivalName}</strong><br>
                <div style="background:#333;border-radius:3px;height:8px;margin:5px 0">
                    <div style="background:#2ecc71;width:${pct}%;height:100%;border-radius:3px;transition:width 0.3s"></div>
                </div>
                <span style="font-size:11px">Your power: ${formatNumber(b.playerPower)} vs ${formatNumber(b.rivalPower)}</span><br>
                <button onclick="window.retreatBattle(gameState);renderWar();" style="margin-top:5px;padding:3px 10px;background:#e67e22;color:#fff;border:none;border-radius:3px;cursor:pointer">Retreat</button>
            `;
            rivalList.appendChild(bDiv);
        }
    }
}

window.trainUnit = function(key) {
    const unit = UNITS[key];
    if (!unit) return;
    for (let res in (unit.cost||{})) {
        if ((gameState.resources[res]||0) < unit.cost[res]) {
            addGameLog("❌ Not enough " + res + " to train " + unit.name); return;
        }
    }
    for (let res in (unit.cost||{})) gameState.resources[res] -= unit.cost[res];
    if (!gameState.army) gameState.army = {};
    gameState.army[key] = (gameState.army[key]||0) + 1;
    addGameLog("⚔️ Trained: " + unit.icon + " " + unit.name);
    renderWar();
    updateUI();
};

window.attackRival = function(rivalIdx) {
    const result = startBattle(gameState, rivalIdx, "default", getGlobalMultiplier("army", null));
    if (!result.success) { addGameLog("❌ " + result.msg); }
    else { addGameLog("⚔️ Battle started vs " + RIVALS[rivalIdx].name + "!"); }
    renderWar();
};


// ─── HEROES ────────────────────────────────────────────────────────────────
function renderHeroes() {
    const gppEl = document.getElementById("gpp-display");
    const heroList = document.getElementById("hero-list");
    if (!gameState.heroes) gameState.heroes = { owned: [], gpp: 0, threshold: 1000 };

    if (gppEl) {
        const pct = Math.round((gameState.heroes.gpp / gameState.heroes.threshold) * 100);
        gppEl.innerHTML = `
            <span>Great People Points: ${formatNumber(Math.floor(gameState.heroes.gpp))} / ${formatNumber(gameState.heroes.threshold)}</span>
            <div style="background:#333;border-radius:3px;height:6px;margin:4px 0;width:200px">
                <div style="background:#f39c12;width:${Math.min(100,pct)}%;height:100%;border-radius:3px;transition:width 0.5s"></div>
            </div>
        `;
    }

    if (heroList) {
        heroList.innerHTML = "";
        if (gameState.heroes.owned.length === 0) {
            heroList.innerHTML = "<p style='color:#888'>No great people yet. Gain GPP to recruit.</p>";
        } else {
            gameState.heroes.owned.forEach(hero => {
                const div = document.createElement("div");
                div.style.cssText = "border:1px solid #f39c12;padding:10px;margin-bottom:8px;background:rgba(243,156,18,0.1);border-radius:6px;display:flex;align-items:center;gap:12px";
                div.innerHTML = `
                    <span style="font-size:32px">${hero.icon||"👑"}</span>
                    <div>
                        <div style="font-weight:bold;font-size:14px">${hero.name}</div>
                        <div style="font-size:11px;color:#f39c12">${hero.title||""}</div>
                        <div style="font-size:11px;color:#2ecc71">${hero.desc||""}</div>
                    </div>
                `;
                heroList.appendChild(div);
            });
        }

        // All available heroes grid
        const allHeroDiv = document.createElement("div");
        allHeroDiv.innerHTML = "<h4 style='color:#888;font-size:12px;margin:10px 0 6px'>Available to Recruit:</h4>";
        const grid = document.createElement("div");
        grid.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
        HEROES.forEach(hero => {
            const owned = gameState.heroes.owned.some(h => h.id === hero.id);
            if (owned) return;
            const span = document.createElement("div");
            span.style.cssText = `padding:6px;background:#222;border:1px solid #444;border-radius:5px;font-size:11px;text-align:center;min-width:80px;opacity:${gameState.heroes.gpp >= gameState.heroes.threshold ? 1 : 0.5}`;
            span.title = hero.desc || "";
            span.innerHTML = `${hero.icon||"👤"}<br>${hero.name}<br><span style='color:#888'>${hero.type}</span>`;
            grid.appendChild(span);
        });
        allHeroDiv.appendChild(grid);
        heroList.appendChild(allHeroDiv);
    }
}

window.recruitHeroBtn = function() {
    if (!gameState.heroes) gameState.heroes = { owned: [], gpp: 0, threshold: 1000 };
    if (gameState.heroes.gpp < gameState.heroes.threshold) {
        addGameLog("❌ Need " + formatNumber(gameState.heroes.threshold) + " GPP to recruit");
        return;
    }
    const hero = recruitHero(gameState);
    if (hero) {
        addGameLog("👑 Great Person recruited: " + hero.icon + " " + hero.name + " — " + (hero.desc||""));
        renderHeroes();
        updateUI();
    } else {
        addGameLog("All great people already recruited!");
    }
};


// ─── GOVERNMENT ────────────────────────────────────────────────────────────
function renderGovernment() {
    const curGovEl = document.getElementById("gov-current");
    const govList  = document.getElementById("gov-list");
    const polList  = document.getElementById("policy-list");
    if (!gameState.government) gameState.government = { active: "gov_tribal", policies: [] };

    const curGovId = gameState.government.active || "gov_tribal";
    const curGov   = GOVERNMENTS.find(g => g.id === curGovId);

    if (curGovEl && curGov) {
        curGovEl.innerHTML = `
            <div style="font-size:18px">${curGov.icon||"⚖️"}</div>
            <div style="font-weight:bold">${curGov.name}</div>
            <div style="font-size:11px;color:#aaa;margin-top:4px">${curGov.description||""}</div>
            <div style="font-size:11px;color:#2ecc71;margin-top:4px">${
                Object.entries(curGov.effect||{}).map(([k,v])=>`${k}: ×${v}`).join(" · ")
            }</div>
        `;
    }

    if (govList) {
        govList.innerHTML = "";
        const curEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);
        GOVERNMENTS.forEach(gov => {
            const reqIdx = ERA_DATA.findIndex(e => e.name === (gov.era||"Stone Age"));
            if (curEraIdx < reqIdx) return;
            const isActive = gov.id === curGovId;
            const div = document.createElement("div");
            div.style.cssText = `border:1px solid ${isActive?'#f39c12':'#555'};padding:8px;margin-bottom:6px;background:${isActive?'rgba(243,156,18,0.1)':'rgba(0,0,0,0.3)'};border-radius:5px;display:flex;justify-content:space-between;align-items:center`;
            div.innerHTML = `
                <div>
                    <div style="font-weight:bold">${gov.icon||"⚖️"} ${gov.name} ${isActive?'<span style="color:#f39c12">(Active)</span>':''}</div>
                    <div style="font-size:11px;color:#aaa">${gov.description||""}</div>
                    <div style="font-size:11px;color:#2ecc71">${
                        Object.entries(gov.effect||{}).map(([k,v])=>`${k}: ×${v}`).join(" · ")
                    }</div>
                </div>
                ${!isActive ? `<button onclick="window.adoptGovBtn('${gov.id}')"
                    style="padding:3px 10px;background:#2980b9;color:#fff;border:none;border-radius:3px;cursor:pointer">Adopt</button>` : ''}
            `;
            govList.appendChild(div);
        });
    }

    if (polList) {
        polList.innerHTML = "";
        POLICIES.forEach(pol => {
            const isActive = (gameState.government.policies||[]).includes(pol.id);
            const reqGov = pol.requires ? GOVERNMENTS.find(g => g.id === pol.requires) : null;
            const govOK  = !pol.requires || gameState.government.active === pol.requires;
            const div = document.createElement("div");
            div.style.cssText = `border:1px solid ${isActive?'#2ecc71':'#555'};padding:8px;margin-bottom:5px;background:${isActive?'rgba(46,204,113,0.1)':'rgba(0,0,0,0.2)'};border-radius:4px;display:flex;justify-content:space-between;align-items:center;opacity:${govOK?1:0.5}`;
            div.innerHTML = `
                <div>
                    <div style="font-weight:bold;font-size:12px">${pol.name} ${isActive?'✅':''}</div>
                    <div style="font-size:10px;color:#aaa">${pol.description||""}</div>
                    ${reqGov ? `<div style="font-size:10px;color:#f39c12">Requires: ${reqGov.name}</div>` : ''}
                </div>
                <button onclick="window.togglePolicyBtn('${pol.id}')"
                    style="padding:2px 8px;background:${isActive?'#c0392b':govOK?'#27ae60':'#444'};color:#fff;border:none;border-radius:3px;cursor:${govOK?'pointer':'default'}"
                    ${govOK?'':'disabled'}>${isActive?'Repeal':'Enact'}</button>
            `;
            polList.appendChild(div);
        });
    }
}

window.adoptGovBtn = function(govId) {
    const result = adoptGovernment(gameState, govId);
    if (result && result.success === false) { addGameLog("❌ " + result.msg); return; }
    addGameLog("⚖️ Government changed to: " + (GOVERNMENTS.find(g=>g.id===govId)?.name||govId));
    renderGovernment();
    updateUI();
};
window.togglePolicyBtn = function(polId) {
    togglePolicy(gameState, polId);
    const pol = POLICIES.find(p=>p.id===polId);
    const active = (gameState.government.policies||[]).includes(polId);
    addGameLog((active?"✅ Enacted":"🚫 Repealed") + ": " + (pol?.name||polId));
    renderGovernment();
    updateUI();
};


// ─── ACHIEVEMENTS ──────────────────────────────────────────────────────────
function renderAchievements() {
    const container = document.getElementById("achievements-list");
    if (!container) return;
    if (!gameState.achievements) gameState.achievements = [];

    const unlocked = ACHIEVEMENTS.filter(a => gameState.achievements.includes(a.id));
    const locked   = ACHIEVEMENTS.filter(a => !gameState.achievements.includes(a.id));

    container.innerHTML = `
        <div style="color:#f39c12;margin-bottom:8px;font-weight:bold">
            🏆 ${unlocked.length} / ${ACHIEVEMENTS.length} Achievements Unlocked
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${unlocked.map(a => `
                <div style="border:1px solid #f39c12;background:rgba(243,156,18,0.1);border-radius:6px;padding:8px;min-width:120px;max-width:160px;text-align:center" title="${a.desc||''}">
                    <div style="font-size:22px">${a.icon||"🏅"}</div>
                    <div style="font-weight:bold;font-size:11px">${a.name}</div>
                    <div style="font-size:10px;color:#aaa">${a.desc||""}</div>
                </div>
            `).join("")}
            ${locked.map(a => `
                <div style="border:1px solid #333;background:rgba(0,0,0,0.3);border-radius:6px;padding:8px;min-width:120px;max-width:160px;text-align:center;opacity:0.4" title="Locked">
                    <div style="font-size:22px">🔒</div>
                    <div style="font-weight:bold;font-size:11px;color:#555">${a.name}</div>
                </div>
            `).join("")}
        </div>
    `;
}

function renderVictoryModal() {
    if (document.getElementById("victory-modal")) return;

    const modal = document.createElement("div");
    modal.id = "victory-modal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.background = "rgba(0,0,0,0.9)";
    modal.style.color = "white";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.zIndex = "10000";
    modal.innerHTML = `
        <h1 style="font-size: 3em; color: #f1c40f; text-shadow: 0 0 10px #f1c40f;">VICTORY ACHIEVED!</h1>
        <p style="font-size: 1.2em; max-width: 600px; text-align: center;">
            You have guided your civilization from the dawn of time to the pinnacle of technological singularity.
            The universe lies before you, waiting to be explored.
        </p>
        <div style="margin-top: 20px;">
            <button onclick="claimVictory()" style="padding: 15px 30px; font-size: 1.5em; cursor: pointer; background: #2ecc71; border: none; color: white; border-radius: 5px;">Continue Playing (Endless Mode)</button>
        </div>
        <div style="margin-top: 20px;">
            <button onclick="performTranscendence()" style="padding: 15px 30px; font-size: 1.5em; cursor: pointer; background: #9b59b6; border: none; color: white; border-radius: 5px;">Transcend (New Game+)</button>
        </div>
    `;
    document.body.appendChild(modal);
}

window.claimVictory = function() {
    gameState.victoryClaimed = true;
    const modal = document.getElementById("victory-modal");
    if (modal) modal.remove();
    updateUI();
    alert("Deep Space Scanners Online! You can now explore infinite procedural planets.");
};

window.performTranscendence = function() {
    if (!confirm("Are you sure? This will reset your progress but grant powerful Prestige bonuses.")) return;

    // Increment Transcendence Count
    if (!gameState.stats.transcendenceCount) gameState.stats.transcendenceCount = 0;
    gameState.stats.transcendenceCount++;

    // Keep stats but reset game
    const tCount = gameState.stats.transcendenceCount;

    // Save only meta data
    const metaData = {
        transcendenceCount: tCount,
        lifetimeClicks: gameState.stats.totalClicks
    };
    localStorage.setItem("hc_web_meta", JSON.stringify(metaData));

    // Clear main save
    localStorage.removeItem("hc_web_save");

    location.reload();
};

window.scanNewPlanet = function() {
    const scanCost = Math.floor(1000000 * Math.pow(1.5, Math.max(0, gameState.space.planets.length - 5)));
    if (gameState.resources.knowledge < scanCost) {
        alert("Not enough Knowledge to scan deep space! Need " + formatNumber(scanCost));
        return;
    }

    gameState.resources.knowledge -= scanCost;

    // Generate planet using existing function if possible
    const newPlanets = generatePlanets(1);
    const planet = newPlanets[0];

    // Buff it for Deep Space
    planet.name = "Deep Space " + planet.name;
    planet.production.money *= 2;
    planet.production.knowledge *= 2;
    planet.resources.push("dark_matter"); // Just for flavor

    // Scale colonization cost
    if (planet.cost) {
        planet.cost.money = (planet.cost.money || 10000) * 10;
        planet.cost.knowledge = (planet.cost.knowledge || 5000) * 10;
        planet.cost.food = (planet.cost.food || 2000) * 10;
    }

    gameState.space.planets.push(planet);

    if (window.audioController) window.audioController.playEvent();
    alert(`Deep Space Scan Complete! Found: ${planet.name} (${planet.type})`);

    updateUI();
    renderSpace(); // Refresh view
};

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function renderQuestList() {
    const list = document.getElementById("quest-list");
    if (!list) return;

    if (!gameState.quests || gameState.quests.length === 0) {
        list.innerHTML = "<p>No quests available.</p>";
        return;
    }

    list.innerHTML = "";
    gameState.quests.forEach(q => {
        const div = document.createElement("div");
        div.id = `quest-${q.id}`;
        div.className = "quest-item";
        div.style.marginBottom = "8px";
        div.style.padding = "8px";
        div.style.background = "rgba(255,255,255,0.05)";
        div.style.borderRadius = "4px";

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                <span>${q.title}</span>
                <span id="quest-status-${q.id}">${q.completed ? (q.claimed ? '✅' : '🎁') : ''}</span>
            </div>
            <div style="background:#333; height:6px; width:100%; margin-top:5px; border-radius:3px; overflow:hidden;">
                <div id="quest-bar-${q.id}" style="height:100%; width:${(q.progress / q.target) * 100}%; background:#f1c40f; transition: width 0.2s;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:2px;">
                <small id="quest-text-${q.id}">${Math.floor(q.progress)} / ${q.target}</small>
                ${!q.claimed && q.completed ? `<button class="claim-btn" onclick="claimQuest('${q.id}')" style="padding:2px 6px; font-size:0.7rem;">Claim</button>` : ''}
            </div>
        `;
        list.appendChild(div);
    });
}

function updateQuestUI() {
    if (!gameState.quests) return;

    gameState.quests.forEach(q => {
        // Direct DOM update by ID to avoid thrashing
        const bar = document.getElementById(`quest-bar-${q.id}`);
        const text = document.getElementById(`quest-text-${q.id}`);
        const status = document.getElementById(`quest-status-${q.id}`);
        const item = document.getElementById(`quest-${q.id}`);

        if (bar) bar.style.width = `${Math.min(100, (q.progress / q.target) * 100)}%`;
        if (text) text.innerText = `${Math.floor(q.progress)} / ${q.target}`;

        // If state changed to completed and button missing, re-render specific item?
        // Or just handle the claim button visibility.
        // For simplicity, if completion state changes, we might want to re-render just that item or toggle class.
        // But the button insertion is HTML structure change.
        if (q.completed && !q.claimed) {
             if (item && !item.querySelector("button")) {
                 // Lazy re-render or inject button
                 renderQuestList(); // Re-render all to be safe and simple for now, or optimize later.
             }
        }
    });
}

// Expose functions to window if needed or just keep in module scope
window.renderQuestList = renderQuestList;
window.updateQuestUI = updateQuestUI;

window.renderAscensionTree = function() {
    if (document.getElementById("ascension-modal")) {
        // Toggle visibility if exists? Or remove?
        // Let's just remove to re-render or close
        document.body.removeChild(document.getElementById("ascension-modal"));
        return;
    }

    const modal = document.createElement("div");
    modal.id = "ascension-modal";
    modal.className = "modal-overlay";

    // Build Perk HTML
    let perksHtml = "";
    // Note: ASCENSION_TREE is imported but we need to iterate it.
    // Assuming ASCENSION_TREE is globally available or imported.
    // It is imported in script.js.

    // We need to access ASCENSION_TREE here. It was imported.
    // But since I'm appending this to script.js, I might not have access to the import inside this function scope
    // if I was using `cat`. Wait, `cat` appends to the file, so it's in the module scope.

    // However, I need to make sure I don't break the module.
    // Let's assume ASCENSION_TREE is available.

    if (typeof ASCENSION_TREE !== 'undefined') {
        ASCENSION_TREE.forEach(perk => {
            const owned = gameState.ascensionPerks.includes(perk.id);
            const available = perk.req.every(r => gameState.ascensionPerks.includes(r));

            perksHtml += `
                <div class="perk-node" style="
                    border: 2px solid ${owned ? '#2ecc71' : (available ? '#f1c40f' : '#7f8c8d')};
                    background: ${owned ? 'rgba(46, 204, 113, 0.2)' : 'rgba(0,0,0,0.5)'};
                    padding: 10px;
                    margin: 5px;
                    width: 200px;
                    display: inline-block;
                    vertical-align: top;
                    cursor: ${available && !owned ? 'pointer' : 'default'};
                    opacity: ${available || owned ? 1 : 0.5};
                " onclick="${available && !owned ? `buyAscensionPerkWrapper('${perk.id}')` : ''}">
                    <strong>${perk.name}</strong><br>
                    <small>${perk.desc}</small><br>
                    <small style="color: gold">Cost: ${perk.cost} SE</small>
                </div>
            `;
        });
    } else {
        perksHtml = "<p>Error: Ascension Tree data not found.</p>";
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 80vh; overflow-y: auto;">
            <h2>Ascension Tree 🌌</h2>
            <p>Spend Symbols of Era (SE) to gain permanent multiverse upgrades.</p>
            <p>Available SE: <span id="modal-se-display">${gameState.resources.symbolsOfEra}</span></p>
            <div id="ascension-tree-container" style="text-align: center;">
                ${perksHtml}
            </div>
            <button onclick="document.body.removeChild(document.getElementById('ascension-modal'))" style="margin-top: 20px; background: #c0392b;">Close</button>
        </div>
    `;

    document.body.appendChild(modal);
}

window.buyAscensionPerkWrapper = function(perkId) {
    // We need to import buyAscensionPerk logic or use the one exposed?
    // script.js imports { buyAscensionPerk } from './ascension.js'.
    // It's in module scope.

    // We need to verify if buyAscensionPerk is accessible.
    // Since we are in the same file (script.js), yes.

    const result = buyAscensionPerk(gameState, perkId);
    if (result.success) {
        alert(result.msg);
        // Re-render
        document.body.removeChild(document.getElementById("ascension-modal"));
        renderAscensionTree();
        updateUI();
    } else {
        alert(result.msg);
    }
}

/* EXPEDITIONS SYSTEM */
function renderExpeditions() {
    const list = document.getElementById("expedition-list");
    if (!list) return;

    // Use generated expeditions from content-gen, filtered by era
    const available = (window.allExpeditions || []).filter(exp => {
        const expEraIdx = ERA_DATA.findIndex(e => e.name === (exp.era || "Stone Age"));
        const curEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);
        return curEraIdx >= expEraIdx;
    });

    if (available.length === 0) {
        list.innerHTML = "<p style='color:#888'>No expeditions available yet. Advance your era.</p>";
    } else {
        list.innerHTML = "";
        available.forEach(exp => {
            const alreadyActive = (gameState.activeExpeditions || []).some(a => a.id === exp.id);
            const costStr = Object.entries(exp.cost || {}).map(([k,v]) => `${formatNumber(v)} ${k}`).join(", ") || "Free";
            const canAfford = Object.entries(exp.cost || {}).every(([k,v]) => (gameState.resources[k]||0) >= v);
            const div = document.createElement("div");
            div.style.cssText = "border:1px solid #555;padding:10px;margin-bottom:8px;background:rgba(0,0,0,0.3);border-radius:6px";
            div.innerHTML = `
                <div style="font-weight:bold">${exp.icon||"🗺️"} ${exp.name}</div>
                <div style="font-size:11px;color:#aaa;margin:3px 0">${exp.description||""}</div>
                <div style="font-size:11px">Cost: ${costStr} · Duration: ${exp.duration}s</div>
                <div style="font-size:11px;color:#f1c40f">Reward: ${exp.rewardDesc||"Resources"}</div>
                <button onclick="window.startExpedition('${exp.id}')"
                    style="margin-top:5px;padding:3px 10px;background:${alreadyActive?'#555':canAfford?'#2980b9':'#444'};color:#fff;border:none;border-radius:3px;cursor:${canAfford&&!alreadyActive?'pointer':'default'}"
                    ${alreadyActive||!canAfford?'disabled':''}>
                    ${alreadyActive ? "Active" : canAfford ? "Send" : "Need resources"}
                </button>
            `;
            list.appendChild(div);
        });
    }
    renderActiveExpeditions();
}

function renderActiveExpeditions() {
    const list = document.getElementById("active-expedition-list");
    if (!list) return;

    list.innerHTML = "";
    if (!gameState.activeExpeditions || gameState.activeExpeditions.length === 0) {
        list.innerHTML = "<p>No active expeditions.</p>";
        return;
    }

    gameState.activeExpeditions.forEach((exp, idx) => {
        const div = document.createElement("div");
        div.style.marginTop = "5px";
        const progress = Math.min(100, (exp.progress / exp.duration) * 100);
        div.innerHTML = `
            <span>${exp.name}</span>
            <div style="background:#333; height:10px; width:100%;"><div style="background:#2ecc71; height:100%; width:${progress}%"></div></div>
        `;
        list.appendChild(div);
    });
}

window.startExpedition = function(expId) {
    const expData = gameState.expeditions.find(e => e.id === expId);
    if (!expData) return;

    // Check cost
    for (let res in expData.cost) {
        if ((gameState.resources[res] || 0) < expData.cost[res]) {
            alert("Not enough " + res);
            return;
        }
    }

    // Deduct
    for (let res in expData.cost) {
        gameState.resources[res] -= expData.cost[res];
    }

    // Start
    if (!gameState.activeExpeditions) gameState.activeExpeditions = [];
    gameState.activeExpeditions.push({
        id: expId,
        name: expData.name,
        duration: expData.duration,
        progress: 0
    });

    updateUI();
    renderActiveExpeditions();
};

function completeExpedition(exp) {
    gameState.activeExpeditions = (gameState.activeExpeditions || []).filter(e => e.id !== exp.id);

    // Grant rewards from exp.rewards array or fallback
    let msg = `🗺️ "${exp.name}" returned!`;
    const rewards = exp.rewards || [{ resource: "wood", amount: [50, 150] }];
    rewards.forEach(r => {
        const amt = Math.floor(r.amount[0] + Math.random() * (r.amount[1] - r.amount[0]));
        if (gameState.resources[r.resource] !== undefined) {
            gameState.resources[r.resource] += amt;
        } else if (r.resource === "relic") {
            // Generate a relic
            if (window.allRelics && allRelics.length > 0) {
                const relic = allRelics[Math.floor(Math.random() * allRelics.length)];
                if (!gameState.inventory) gameState.inventory = [];
                gameState.inventory.push({...relic});
            }
        }
        msg += ` +${formatNumber(amt)} ${r.resource}`;
    });
    addGameLog(msg);
    updateUI();
    renderExpeditions();
}

// Attach to global for safety
window.renderExpeditions = renderExpeditions;
window.renderActiveExpeditions = renderActiveExpeditions;
window.completeExpedition = completeExpedition;

// ── Expose tab renderers to window for showTab() ──────────────────────────
window.renderExpeditions  = renderExpeditions;
window.renderCrafting     = renderCrafting;
window.renderWar          = renderWar;
window.retreatBattle      = retreatBattle;
window.renderHeroes       = renderHeroes;
window.renderGovernment   = renderGovernment;
window.renderAchievements = renderAchievements;


// --- Global Event Bindings (Critical for DOM Access) ---
window.buyResearch = buyResearch;
window.claimQuest = claimQuest;
window.cloudLogin = cloudLogin;
window.renderStoryModal = renderStoryModal;
window.startExpedition = function(expId) {
    const exp = (window.allExpeditions || []).find(e => e.id === expId);
    if (!exp) return;
    if (!gameState.activeExpeditions) gameState.activeExpeditions = [];
    if (gameState.activeExpeditions.some(a => a.id === expId)) return;
    // Deduct cost
    for (let res in (exp.cost||{})) {
        if ((gameState.resources[res]||0) < exp.cost[res]) {
            addGameLog("❌ Not enough " + res + " for expedition"); return;
        }
    }
    for (let res in (exp.cost||{})) gameState.resources[res] -= exp.cost[res];
    gameState.activeExpeditions.push({ ...exp, progress: 0 });
    addGameLog("🗺️ Expedition started: " + exp.name);
    renderExpeditions();
    updateUI();
};
window.manualClick = manualClick;
window.buyBuilding = buyBuilding;
window.saveGame = saveGame;
window.performPrestige = performPrestige;
// Other UI helpers already attached in their definitions or shims
