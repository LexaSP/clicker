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
            alert("Login failed: " + e.message);
        }
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
    buildings: {
        // Ancient
        "AutoClicker": { count: 0, baseCost: 15, priceRatio: 1.30, production: 0.2, icon: "👆", era: 0 }, // Stone Age
        "Gatherer": { count: 0, baseCost: 50, priceRatio: 1.30, production: 0.5, icon: "🧺", era: 0, produces: { food: 0.25, wood: 0.05 } }, // Stone Age
        "Farm": { count: 0, baseCost: 250, priceRatio: 1.30, production: 1.5, icon: "🌾", era: 1, produces: { food: 1 } }, // Bronze Age
        "Mine": { count: 0, baseCost: 1000, priceRatio: 1.30, production: 5, icon: "⛏️", era: 1, upkeep: { wood: 1 }, produces: { stone: 0.25, iron: 0.05 } }, // Bronze Age
        "Workshop": { count: 0, baseCost: 5000, priceRatio: 1.30, production: 12.5, icon: "🔨", era: 2, upkeep: { stone: 2 }, produces: { steel: 0.02 } }, // Iron Age

        // Classical/Medieval
        "Aqueduct": { count: 0, baseCost: 15000, priceRatio: 1.35, production: 25, icon: "💧", era: 2, produces: { food: 2.5 } }, // Iron Age
        "University": { count: 0, baseCost: 50000, priceRatio: 1.35, production: 50, icon: "🎓", era: 3 }, // Middle Ages
        "Bank": { count: 0, baseCost: 250000, priceRatio: 1.35, production: 125, icon: "🏦", era: 4 }, // Renaissance

        // Industrial/Modern
        "Factory": { count: 0, baseCost: 1000000, priceRatio: 1.40, production: 400, icon: "🏭", era: 5, upkeep: { iron: 2, energy: 5 }, produces: { oil: 0.05, steel: 0.25 } }, // Industrial Age
        "Lab": { count: 0, baseCost: 5000000, priceRatio: 1.45, production: 750, icon: "🔬", era: 6 }, // Modern Age
        "PowerPlant": { count: 0, baseCost: 25000000, priceRatio: 1.50, production: 2500, icon: "⚡", era: 6, upkeep: { wood: 5 }, produces: { energy: 5 } }, // Modern Age

        // Future
        "Supercomputer": { count: 0, baseCost: 100000000, priceRatio: 1.55, production: 10000, icon: "🖥️", era: 7 }, // Information Age
        "FusionReactor": { count: 0, baseCost: 1000000000, priceRatio: 1.60, production: 50000, icon: "⚛️", era: 8, produces: { energy: 50 } } // Future Age
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
    "tab-btn-war": { era: "Bronze Age" },
    "tab-btn-government": { era: "Iron Age" },
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

        // Generate quests if needed
        if (gameState.quests.length === 0) {
            generateDailyQuests();
        }

        // 2. UI Initialization (Synchronous - Critical for display)
        // Must happen BEFORE visibility updates
        initBuildingsUI();
        initUI(); // This calls renderResearchTree and injectDynamicTabs
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

function calculateProduction(state, dt = 0, applyCosts = false) {
    let production = 0;

    // Core Clicks Production
    const clickProducers = ["AutoClicker", "Gatherer", "Farm", "Mine", "Workshop", "Aqueduct", "Factory", "PowerPlant", "FusionReactor"];

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

            // Produce Clicks
            production += b.count * b.production * efficiency;

            // Produce Unique Resources (Population logic is separate)
            if (applyCosts && b.produces) {
                for (let res in b.produces) {
                    const amount = b.produces[res] * b.count * dt * efficiency;
                    if (state.resources[res] !== undefined) {
                        const max = state.maxStorage || 10000;
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

    // Knowledge
    let knowledgeProd = 0;
    if (gameState.buildings["University"]) knowledgeProd += gameState.buildings["University"].count * gameState.buildings["University"].production;
    if (gameState.buildings["Lab"]) knowledgeProd += gameState.buildings["Lab"].count * gameState.buildings["Lab"].production;
    if (gameState.buildings["Supercomputer"]) knowledgeProd += gameState.buildings["Supercomputer"].count * gameState.buildings["Supercomputer"].production;
    knowledgeProd *= getGlobalMultiplier("production_mult", "knowledge");

    // Money
    let moneyProd = 0;
    if (gameState.buildings["Bank"]) moneyProd += gameState.buildings["Bank"].count * gameState.buildings["Bank"].production;
    moneyProd *= getGlobalMultiplier("production_mult", "money");

    // Population Growth Logic
    // Max Pop = Base 10 + Housing from buildings
    const housing = 10 +
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
                const max = gameState.maxStorage || 10000;
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
    [...gameState.activeExpeditions].forEach((exp, index) => {
        exp.progress += dt;
        if (exp.progress >= exp.duration) {
            completeExpedition(exp);
        }
    });

    // Leaderboard Rewards
    checkLeaderboardRewards(gameState);

    // Golden Relic Spawner (NERFED: 0.005 -> 0.001)
    let goldenChance = 0.001;
    if (gameState.prestigeUpgrades && gameState.prestigeUpgrades["golden_freq"]) {
        goldenChance += gameState.prestigeUpgrades["golden_freq"].level * 0.001;
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

function checkStoryEvents() {
    // NERFED: 5% -> 1% chance per check (15s)
    if (Math.random() > 0.01) return;

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
    const cps = calculateProduction(gameState, 0, false);

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
        spawnFloatingText(event.clientX, event.clientY, `+${formatNumber(clickValue)}`, isCrit ? "#e74c3c" : "#f1c40f");
    }

    checkQuestProgress("clicks", 1);

    if (Math.random() < 0.05) {
        gameState.resources.relicShards++;
        checkQuestProgress("shards", 1);
    }
    updateUI();
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
    }
};

window.buyResearch = function(techId) {
    // Challenge Constraint: No Research
    if (gameState.activeChallenge === "austere") {
        alert("Challenge Constraint: Research is disabled!");
        return;
    }

    const tech = allResearch.find(t => t.id === techId);
    if (!tech) {
        console.error("buyResearch: Tech not found!", techId);
        return;
    }

    let costMult = getGlobalMultiplier("cost", "knowledge"); // Tech cost is usually knowledge
    const cost = Math.floor(tech.cost * costMult);

    const reqMet = tech.requirements.every(req => gameState.researched.includes(req));
    const costType = tech.costType || "knowledge"; // Default to knowledge

    console.log(`Attempting to buy ${techId}. Cost: ${cost} ${costType}. Reqs Met: ${reqMet}`);

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
        } else {
            console.log("Not enough resources.");
        }

        if (purchased) {
            if (window.audioController) window.audioController.playUnlock();
            gameState.researched.push(techId);
            console.log(`Purchased ${techId}`);

            // Stats
            if (!gameState.stats) gameState.stats = {};
            if (!gameState.stats.techsResearched) gameState.stats.techsResearched = 0;
            gameState.stats.techsResearched++;

            updateUI();
            // Force redraw of tree
            renderResearchTree();
        }
    } else {
        console.log("Requirements not met or already researched.");
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
    const clickProducers = ["AutoClicker", "Gatherer", "Farm", "Mine", "Workshop", "Aqueduct", "Factory", "PowerPlant", "FusionReactor"];
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
            const max = gameState.maxStorage || 10000;
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

function updateVisibility() {
    const currentEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);

    for (let id in FEATURE_UNLOCKS) {
        const req = FEATURE_UNLOCKS[id];
        const reqEraIdx = ERA_DATA.findIndex(e => e.name === req.era);

        const el = document.getElementById(id);
        if (el) {
            if (currentEraIdx >= reqEraIdx) {
                // Show only if hidden, to avoid flicker or style resets
                if (el.style.display === "none") {
                    el.style.display = "inline-block";
                }
            } else {
                // STRICT HIDING
                el.style.display = "none";

                // ALSO Hide the view content if it's currently active to prevent ghost views
                // Derive view ID from btn ID (heuristic: tab-btn-X -> X-view)
                const viewId = id.replace("tab-btn-", "") + "-view";
                const viewEl = document.getElementById(viewId);
                if (viewEl) {
                    viewEl.style.display = "none";
                }
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

    // STRICT ERA 1 VISIBILITY FALLBACK
    // Explicitly unhide Era 1 buildings if logic fails
    const clickBtn = document.getElementById("click-btn");
    if (clickBtn) clickBtn.style.display = "block";

    // AutoClicker and Gatherer
    const autoBtn = document.getElementById("btn-AutoClicker");
    if (autoBtn) autoBtn.style.display = "flex"; // Using flex as per style.css

    const gatherBtn = document.getElementById("btn-Gatherer");
    if (gatherBtn) gatherBtn.style.display = "flex";

    // Tech Root
    // Rendered via renderResearchTree, but ensure the tab is visible
    const resTab = document.getElementById("tab-btn-research");
    if (resTab) resTab.style.display = "inline-block";

    // --- NEW: Era-Gating for Buildings ---
    Object.keys(gameState.buildings).forEach(name => {
        const b = gameState.buildings[name];
        const btn = document.getElementById(`btn-${name}`);
        if (btn) {
            // b.era is now a number index. currentEraIdx is also a number index.
            if (b.era > currentEraIdx) {
                btn.style.setProperty("display", "none", "important");
            } else {
                btn.style.setProperty("display", "flex", "important");
            }
        }
    });

    // --- NEW: Stellar Map Lockdown ---
    const starBtn = document.getElementById("btn-stellar-map");
    if (starBtn) {
        if (gameState.era === "Future Age" || (gameState.space && gameState.space.planets.length > 0)) {
            starBtn.style.display = "block";
        } else {
            starBtn.style.display = "none";
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
    // NERFED & REBALANCED for Prestige Reset as well
    gameState.buildings = {
        "AutoClicker": { count: 0, baseCost: 15, priceRatio: 1.30, production: 0.2, icon: "👆", era: 0 }, // Stone Age
        "Gatherer": { count: 0, baseCost: 50, priceRatio: 1.30, production: 0.5, icon: "🧺", era: 0 }, // Stone Age
        "Farm": { count: 0, baseCost: 250, priceRatio: 1.30, production: 1.5, icon: "🌾", era: 1 }, // Bronze Age
        "Mine": { count: 0, baseCost: 1000, priceRatio: 1.30, production: 5, icon: "⛏️", era: 1, upkeep: { wood: 1 } }, // Bronze Age
        "Workshop": { count: 0, baseCost: 5000, priceRatio: 1.30, production: 12.5, icon: "🔨", era: 2, upkeep: { stone: 2 } }, // Iron Age
        "Aqueduct": { count: 0, baseCost: 15000, priceRatio: 1.35, production: 25, icon: "💧", era: 2 }, // Iron Age
        "University": { count: 0, baseCost: 50000, priceRatio: 1.35, production: 50, icon: "🎓", era: 3 }, // Middle Ages
        "Bank": { count: 0, baseCost: 250000, priceRatio: 1.35, production: 125, icon: "🏦", era: 4 }, // Renaissance
        "Factory": { count: 0, baseCost: 1000000, priceRatio: 1.40, production: 400, icon: "🏭", era: 5, upkeep: { iron: 2, energy: 5 } }, // Industrial Age
        "Lab": { count: 0, baseCost: 5000000, priceRatio: 1.45, production: 750, icon: "🔬", era: 6 }, // Modern Age
        "PowerPlant": { count: 0, baseCost: 25000000, priceRatio: 1.50, production: 2500, icon: "⚡", era: 6, upkeep: { wood: 5 } }, // Modern Age
        "Supercomputer": { count: 0, baseCost: 100000000, priceRatio: 1.55, production: 10000, icon: "🖥️", era: 7 }, // Information Age
        "FusionReactor": { count: 0, baseCost: 1000000000, priceRatio: 1.60, production: 50000, icon: "⚛️", era: 8 } // Future Age
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

    Object.keys(gameState.buildings).forEach(name => {
        const b = gameState.buildings[name];

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

        btn.innerHTML = `
            <div style="font-size:24px;">${b.icon}</div>
            <div>
                <strong>Buy ${name}</strong><br>
                <small>Cost: <span id="cost-${name}">0</span></small> | <small>Owned: <span id="count-${name}">0</span></small><br>
                <small>Prod: ${b.production} Click</small>
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

        const costEl = document.getElementById(`cost-${name}`);
        if (costEl) costEl.innerText = formatNumber(finalCost);

        const countEl = document.getElementById(`count-${name}`);
        if (countEl) countEl.innerText = b.count;

        const btn = document.getElementById(`btn-${name}`);
        if (btn) btn.disabled = gameState.resources.clicks < finalCost;
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
    document.getElementById("res-knowledge").innerText = formatNumber(gameState.resources.knowledge);
    document.getElementById("res-culture").innerText = formatNumber(gameState.resources.culture);
    document.getElementById("res-shards").innerText = gameState.resources.relicShards;

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
        starBtn.id = "btn-stellar-map"; // Added ID for easier targeting
        starBtn.innerText = "Stellar Map ✨";
        starBtn.style.width = "100%";
        starBtn.style.marginTop = "5px";
        starBtn.style.background = "#000";
        starBtn.style.border = "1px solid #f1c40f";
        starBtn.onclick = () => renderConstellationMenu();
        // Default hidden, controlled by updateVisibility
        starBtn.style.display = "none";
        ascContainer.appendChild(starBtn);
    }
}

window.renderResearchTree = function() {
    const container = document.getElementById("research-container");
    if (!container) return;

    // Enable Pan/Drag
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    container.onmousedown = (e) => {
        isDragging = true;
        container.classList.add("active");
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
    };
    container.onmouseleave = () => { isDragging = false; container.classList.remove("active"); };
    container.onmouseup = () => { isDragging = false; container.classList.remove("active"); };
    container.onmousemove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;
        const walkX = (x - startX) * 2; // Speed
        const walkY = (y - startY) * 2;
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    };

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
            // ROOT NODE LOGIC: If no requirements, it is available by default
            const isAvailable = reqMet || tech.requirements.length === 0;
            const isVisible = isDone || isAvailable || tech.requirements.some(r => gameState.researched.includes(r));

            if (isVisible) {
                const div = document.createElement("div");
                div.className = `tech-node ${isDone ? 'researched' : (isAvailable ? 'available' : 'locked')}`;
                div.innerHTML = `<span style="font-size:16px">${tech.icon || '🔬'}</span><br>${tech.name}<br><small>(${formatNumber(tech.cost)})</small>`;
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

                    // Curved Path Logic (Bezier)
                    const p1 = { x: start.x + 150, y: start.y + 30 };
                    const p2 = { x: end.x, y: end.y + 30 };
                    const cp1 = { x: p1.x + 50, y: p1.y };
                    const cp2 = { x: p2.x - 50, y: p2.y };

                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    const d = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
                    path.setAttribute("d", d);
                    path.setAttribute("fill", "none");
                    path.setAttribute("stroke", isDone ? "#2ecc71" : "#555");
                    path.setAttribute("stroke-width", "2");
                    path.setAttribute("class", "tech-line");
                    if (isDone) path.classList.add("active");
                    svg.appendChild(path);
                }
            });
        }
    });
}

// --- Victory & Endgame ---

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
