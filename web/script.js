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

// Firebase Static Imports (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Expose to window for HTML onClick
window.renderLeaderboardModal = renderLeaderboardModal;
window.renderModdingMenu = renderModdingMenu;

// --- Firebase Init ---
const firebaseConfig = {
    apiKey: "AIzaSyAjJT6Mk68KUXDF_4I1u_onNxmlW_CpBHI",
    authDomain: "history-clicker.firebaseapp.com",
    projectId: "history-clicker",
    storageBucket: "history-clicker.firebasestorage.app",
    messagingSenderId: "608395890047",
    appId: "1:608395890047:web:744f343a3ccc9e118c1e4a",
    measurementId: "G-5MDQ8YJJX4"
};

let app, auth, db;
let currentUser = null;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase Initialized (Static)");

    // Auth Listener
    onAuthStateChanged(auth, async (user) => {
        const btn = document.getElementById("btn-cloud-login");
        if (user) {
            currentUser = user;
            console.log("Logged in as:", user.displayName);
            if (btn) btn.innerText = "Logout (" + (user.displayName || "User") + ")";

            // Auto Load check
            if (confirm("Logged in! Load cloud save? (This will overwrite local progress)")) {
                await loadFromCloud();
            }
        } else {
            currentUser = null;
            console.log("Logged out");
            if (btn) btn.innerText = "Cloud Login";
        }
    });

} catch (e) {
    console.warn("Firebase Init Failed:", e);
}

// --- Cloud Functions ---
window.cloudLogin = async function() {
    if (!auth) { alert("Cloud service unavailable."); return; }
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (e) {
        console.error("Login failed:", e);
        alert("Login failed: " + e.message);
    }
};

window.cloudLogout = async function() {
    if (!auth) return;
    try {
        await signOut(auth);
        alert("Logged out.");
    } catch (e) {
        alert("Logout failed: " + e.message);
    }
};

async function saveToCloud() {
    if (!currentUser || !db) return;
    try {
        const userRef = doc(db, "users", currentUser.uid);
        // Save nested in 'saveData' field or directly? usually separate doc or field.
        // Let's save as 'saveData' field to avoid overwriting user meta if any.
        // Actually, user explicitly asked for: users/${user.uid}/saveData/gameState
        // This implies a subcollection 'saveData' with document 'gameState'? Or a field?
        // Let's assume subcollection structure based on "users/${uid}/saveData/gameState" path string style.
        // Or it means doc "gameState" inside collection "saveData" inside doc "uid" inside "users".
        // Let's try: collection(db, "users", uid, "saveData"), doc("gameState")
        const saveRef = doc(db, "users", currentUser.uid, "saveData", "gameState");
        await setDoc(saveRef, gameState);
        console.log("Cloud Save Complete");
    } catch (e) {
        console.error("Cloud Save Error:", e);
    }
}

async function loadFromCloud() {
    if (!currentUser || !db) return;
    try {
        const saveRef = doc(db, "users", currentUser.uid, "saveData", "gameState");
        const docSnap = await getDoc(saveRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            Object.assign(gameState, data);
            migrateSaveData(gameState);
            saveGame(); // Save locally
            updateUI();
            alert("Cloud save loaded successfully!");
        } else {
            alert("No cloud save found.");
        }
    } catch (e) {
        console.error("Cloud Load Error:", e);
        alert("Failed to load cloud save.");
    }
}


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
        if (!gameState.quests || gameState.quests.length === 0) {
            generateDailyQuests();
        }

        // 2. UI Initialization (Synchronous - Critical for display)
        initBuildingsUI();
        initUI(); // This calls renderResearchTree, injectDynamicTabs, and initAscensionUI
        renderQuestList();
        initTutorials(gameState);
        injectCloudButton(); // Inject the cloud button

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

    } catch (e) {
        console.error("CRITICAL INIT ERROR:", e);
        alert("Game Initialization Failed! Check console.");
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
        // Force Reactivity
        if (window.renderQuestList) window.renderQuestList();
        else if (window.updateQuestUI) window.updateQuestUI();
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

    // Strict Prerequisite Logic
    // Must research all requirements before buying
    const reqMet = tech.requirements.every(req => gameState.researched.includes(req));

    if (!reqMet) {
        console.warn("Requirements not met for", tech.name);
        return;
    }

    // Already Researched?
    if (gameState.researched.includes(techId)) {
        return;
    }

    let costMult = getGlobalMultiplier("cost", "knowledge"); // Tech cost is usually knowledge
    const cost = Math.floor(tech.cost * costMult);

    const costType = tech.costType || "knowledge"; // Default to knowledge (was clicks? No, original plan said clicks/knowledge mix)

    // Previously we used clicks as placeholder. Now we switch to knowledge/culture.
    // If user has enough resources
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

        // Force Reactivity
        renderResearchTree();
        updateVisibility(); // Show unlocked stuff
    }
};

// --- Persistence ---
window.saveGame = function() {
    gameState.lastSaveTime = Date.now();
    localStorage.setItem("hc_web_save", JSON.stringify(gameState));
    if (currentUser) {
        saveToCloud().catch(console.error);
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
        if (gameState.resources.clicks >= nextEra.threshold) {
            advanceEra(nextEra);
        }
    }
}

function updateVisibility() {
    const currentEraIdx = ERA_DATA.findIndex(e => e.name === gameState.era);

    // Feature unlocks
    for (let id in FEATURE_UNLOCKS) {
        const req = FEATURE_UNLOCKS[id];
        const reqEraIdx = ERA_DATA.findIndex(e => e.name === req.era);

        const el = document.getElementById(id);
        if (el) {
            // Retroactive Locking: Even if it was visible before, if currentEra < reqEra, FORCE HIDE
            if (currentEraIdx >= reqEraIdx) {
                // Show only if hidden, to avoid flicker or style resets
                if (el.style.display === "none") {
                    el.style.display = "inline-block";
                }
            } else {
                // STRICT HIDING / RETROACTIVE LOCK
                el.style.display = "none";
                el.style.setProperty("display", "none", "important"); // Force override

                // ALSO Hide the view content if it's currently active to prevent ghost views
                // Derive view ID from btn ID (heuristic: tab-btn-X -> X-view)
                const viewId = id.replace("tab-btn-", "") + "-view";
                const viewEl = document.getElementById(viewId);
                if (viewEl) {
                    viewEl.style.display = "none";
                    viewEl.style.setProperty("display", "none", "important");
                }

                // If this tab was active, switch to Research
                if (el.classList.contains("active")) {
                    showTab("research");
                }
            }
        }
    }

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

        // Update Production Text (Base vs Total) - INCLUDING SECONDARY RESOURCES
        const prodEl = document.getElementById(`prod-text-${name}`);
        if (prodEl) {
            const totalProd = b.production * b.count;
            let displayStr = `Prod: ${b.production} Click (Total: ${formatNumber(totalProd)})`;

            // Append Secondary Resources
            if (b.produces) {
                let secStr = "";
                for (let res in b.produces) {
                    const secTotal = b.produces[res] * b.count;
                    // Format: 0.5 food (Total: 8.5)
                    // If multiple: 0.5 food (Total: 8.5), 0.1 wood (Total: 1.7)
                    if (secStr !== "") secStr += ", ";
                    secStr += `${b.produces[res]} ${res} (Total: ${formatNumber(secTotal)})`;
                }
                if (secStr) {
                    displayStr += `<br><span style="color:#2ecc71">Produces: ${secStr}</span>`;
                }
            }

            prodEl.innerHTML = displayStr;
        }

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

    // Population UI
    const popEl = document.getElementById("res-population");
    if (popEl) {
        const housing = 10 +
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
        svg.style.pointerEvents = "none"; // CRITICAL: Ensure clicks pass through
        svg.style.zIndex = "0"; // Behind nodes
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

    // Clear old nodes but keep SVG
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
                div.id = `tech-node-${tech.id}`; // CRITICAL: ID for line connection
                div.className = `tech-node ${isDone ? 'researched' : (isAvailable ? 'available' : 'locked')}`;
                div.innerHTML = `<span style="font-size:16px">${tech.icon || '🔬'}</span><br>${tech.name}<br><small>(${formatNumber(tech.cost)})</small>`;
                div.style.left = `${x}px`;
                div.style.top = `${y}px`;
                div.style.zIndex = "10"; // Above lines
                div.onclick = () => window.buyResearch(tech.id);
                container.appendChild(div);
            }
        });
        colIdx++;
    }

    // Resize SVG to fit content
    svg.style.width = Math.max(container.clientWidth, maxX + 200) + "px";
    svg.style.height = Math.max(container.clientHeight, maxY + 200) + "px";


    // Ensure container is relative for absolute children
    if (getComputedStyle(container).position === "static") {
        container.style.position = "relative";
    }

    // CRITICAL FIX: Wrap geometry calculations in setTimeout to ensure DOM layout is complete
    // and use try/catch to prevent blocking main thread if it fails.
    setTimeout(() => {
        try {
            if (!container) return;
            // Recalculate container rect in case of scroll/resize
            const containerRect = container.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;
            const scrollTop = container.scrollTop;

            allResearch.forEach(tech => {
                if (!positions[tech.id]) return;

                const reqMet = tech.requirements.every(r => gameState.researched.includes(r));
                const isDone = gameState.researched.includes(tech.id);
                const isVisible = isDone || reqMet || tech.requirements.some(r => gameState.researched.includes(r));

                if (isVisible) {
                    tech.requirements.forEach(reqId => {
                        if (positions[reqId]) {
                            // Using cached positions first for stability, or DOM?
                            // Let's use cached positions relative to container origin (0,0)
                            // because getBoundingClientRect depends on current scroll which is tricky.
                            // Actually, we placed them at absolute coordinates (x,y) inside the container.
                            // So we can just use those coordinates!

                            const startPos = positions[reqId];
                            const endPos = positions[tech.id];

                            if (startPos && endPos) {
                                // Center of the node (approx width 120, height 80 based on CSS usually)
                                // Let's get actual dimensions if possible or assume default size
                                // .tech-node is usually absolute positioned.
                                // Let's use the coordinates we assigned + offset.
                                const nodeWidth = 120; // Est
                                const nodeHeight = 80; // Est

                                const x1 = startPos.x + nodeWidth; // Right edge of parent
                                const y1 = startPos.y + nodeHeight / 2; // Middle height
                                const x2 = endPos.x; // Left edge of child
                                const y2 = endPos.y + nodeHeight / 2; // Middle height

                                // Curved Path Logic (Bezier)
                                const cp1 = { x: x1 + 50, y: y1 };
                                const cp2 = { x: x2 - 50, y: y2 };

                                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                                const d = `M ${x1} ${y1} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${x2} ${y2}`;
                                path.setAttribute("d", d);
                                path.setAttribute("fill", "none");
                                path.setAttribute("stroke", isDone ? "#2ecc71" : "#555");
                                path.setAttribute("stroke-width", "2");
                                path.setAttribute("class", "tech-line");
                                path.style.pointerEvents = "none"; // Ensure clicks pass through

                                if (isDone) path.classList.add("active");
                                svg.appendChild(path);
                            }
                        }
                    });
                }
            });
        } catch (e) {
            console.error("Error drawing tech tree lines:", e);
        }
    }, 0);
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

        if (q.completed && !q.claimed) {
             if (item && !item.querySelector("button")) {
                 renderQuestList();
             }
        }
    });
}

// Expose functions to window
window.renderQuestList = renderQuestList;
window.updateQuestUI = updateQuestUI;

window.renderAscensionTree = function() {
    if (document.getElementById("ascension-modal")) {
        document.body.removeChild(document.getElementById("ascension-modal"));
        return;
    }

    const modal = document.createElement("div");
    modal.id = "ascension-modal";
    modal.className = "modal-overlay";

    let perksHtml = "";
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
    const result = buyAscensionPerk(gameState, perkId);
    if (result.success) {
        alert(result.msg);
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

    if (!gameState.expeditions || gameState.expeditions.length === 0) {
        // Fallback or init
        gameState.expeditions = [
            { id: "exp_scout", name: "Scout Wilderness", cost: { food: 50 }, duration: 5, rewardDesc: "Random Resources" },
            { id: "exp_ruins", name: "Explore Ruins", cost: { food: 200, money: 50 }, duration: 15, rewardDesc: "Relic Chance" }
        ];
    }

    list.innerHTML = "";
    gameState.expeditions.forEach(exp => {
        const div = document.createElement("div");
        div.className = "expedition-card";
        div.style.border = "1px solid #7f8c8d";
        div.style.padding = "10px";
        div.style.marginBottom = "10px";
        div.style.background = "rgba(0,0,0,0.3)";
        div.innerHTML = `
            <strong>${exp.name}</strong><br>
            <small>Cost: ${Object.entries(exp.cost).map(([k,v]) => `${v} ${k}`).join(", ")}</small><br>
            <small>Duration: ${exp.duration}s</small><br>
            <button onclick="startExpedition('${exp.id}')" style="margin-top:5px;">Send Expedition</button>
        `;
        list.appendChild(div);
    });

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
    // Remove from active
    gameState.activeExpeditions = gameState.activeExpeditions.filter(e => e !== exp);

    // Grant Reward
    const roll = Math.random();
    let msg = `Expedition '${exp.name}' returned!\n`;

    if (exp.id === "exp_scout") {
        const amount = Math.floor(50 + Math.random() * 50);
        gameState.resources.wood += amount;
        msg += `Found ${amount} Wood.`;
    } else {
        const amount = Math.floor(10 + Math.random() * 20);
        gameState.resources.relicShards += amount;
        msg += `Found ${amount} Relic Shards.`;
    }

    alert(msg);
    updateUI();
    renderActiveExpeditions();
}

// --- Global Event Bindings (Critical for DOM Access) ---
window.buyResearch = buyResearch;
window.claimQuest = claimQuest;
window.cloudLogin = cloudLogin;
window.renderStoryModal = renderStoryModal;
window.startExpedition = startExpedition;
window.manualClick = manualClick;
window.buyBuilding = buyBuilding;
window.saveGame = saveGame;
window.performPrestige = performPrestige;
window.buyAscensionPerkWrapper = buyAscensionPerkWrapper;
