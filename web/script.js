console.log("Script loaded");
// script.js
import { generateRelics, generateResearch, generateIdeas, generateExpeditions, generateRecipes } from './content-gen.js';

// --- Game State ---
let gameState = {
    resources: {
        clicks: 0,
        lifetimeClicks: 0,
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

// --- Era Config ---
const ERA_DATA = [
    { name: "Stone Age", threshold: 0, className: "era-stone" },
    { name: "Bronze Age", threshold: 1000, className: "era-bronze" }, // Placeholder values
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
    // Era Progress
    checkEraProgress();

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
    gameState.resources.lifetimeClicks += production * prodMult * dt;
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
    gameState.resources.lifetimeClicks += clickValue;

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
    // Visual update happens in updateUI
    // Potentially unlock things here
}

function calculatePrestigeGain() {
    // Formula: log10(1 + lifetimeClicks) similar to Swift app log10(1 + clicks)
    // or just sqrt(lifetime / 1M) as per plan.
    // Swift app used: let se = Int(log10(1.0 + Double(max(clicks, 1))))
    // Let's match that loosely but maybe scale it.
    if (gameState.resources.lifetimeClicks < 100) return 0;
    return Math.floor(Math.log10(1 + gameState.resources.lifetimeClicks));
}

window.performPrestige = function() {
    const gain = calculatePrestigeGain();
    if (gain <= 0) {
        alert("Not enough progress to prestige!");
        return;
    }

    if (!confirm(`Reset game to gain ${gain} Symbols of Era?`)) return;

    // Keep
    const symbols = gameState.resources.symbolsOfEra + gain;
    const inventory = gameState.inventory; // Relics persist
    const shards = gameState.resources.relicShards;
    const lifetime = gameState.resources.lifetimeClicks; // Keep lifetime stats? Or reset for run?
    // Usually lifetime accumulates.

    // Reset
    gameState.resources.clicks = 0;
    gameState.resources.money = 0;
    gameState.resources.knowledge = 0;
    gameState.resources.symbolsOfEra = symbols;
    gameState.resources.relicShards = shards;
    gameState.resources.lifetimeClicks = lifetime; // Persist total

    gameState.activeResearch = [];
    gameState.researched = [];
    gameState.activeExpeditions = [];

    // Reset buildings
    for (let key in gameState.buildings) {
        gameState.buildings[key].count = 0;
        // Reset cost logic?
        // Initial costs:
        if (key === "AutoClicker") gameState.buildings[key].cost = 10;
        if (key === "Farm") gameState.buildings[key].cost = 50;
        if (key === "Mine") gameState.buildings[key].cost = 200;
        if (key === "Lab") gameState.buildings[key].cost = 1000;
    }

    gameState.era = "Stone Age";

    saveGame();
    updateUI();
    console.log("Prestige performed!");
};

function updateUI() {
    // Apply Era Theme
    const eraInfo = ERA_DATA.find(e => e.name === gameState.era) || ERA_DATA[0];
    document.body.className = eraInfo.className;

    document.getElementById("res-clicks").innerText = Math.floor(gameState.resources.clicks);
    document.getElementById("res-knowledge").innerText = Math.floor(gameState.resources.knowledge);
    document.getElementById("res-shards").innerText = gameState.resources.relicShards;
    document.getElementById("res-se").innerText = gameState.resources.symbolsOfEra;

    // Show prestige info
    const prestigeBtn = document.getElementById("btn-prestige");
    if (prestigeBtn) {
        const gain = calculatePrestigeGain();
        prestigeBtn.innerText = `Prestige (+${gain} SE)`;
    }

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

    // Create nodes if not exist (idempotent check needed or just clear)
    // For simplicity, we clear and redraw but this resets scroll/state.
    // Better: update classes. But let's stick to redraw for now.

    // Keep SVG
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
    svg.innerHTML = ""; // Clear lines

    // Layout Logic (Simple Columns based on Era)
    const columns = {};
    allResearch.forEach(t => {
        // Find era index
        const eraIdx = ERA_DATA.findIndex(e => t.era === e.name); // Relies on tech.era matching
        // Actually content-gen uses strings "Stone Age" etc.
        const eraName = t.era || "Stone Age";
        if (!columns[eraName]) columns[eraName] = [];
        columns[eraName].push(t);
    });

    const ERA_WIDTH = 250;
    const NODE_HEIGHT = 80;

    // Remove old nodes (keep svg)
    Array.from(container.children).forEach(child => {
        if (child.id !== "tech-tree-svg") container.removeChild(child);
    });

    const positions = {}; // map techId -> {x, y}

    let colIdx = 0;
    for (const era of ERA_DATA) {
        const techs = columns[era.name] || [];
        techs.forEach((tech, rowIdx) => {
            const x = 50 + colIdx * ERA_WIDTH;
            const y = 50 + rowIdx * (NODE_HEIGHT + 20); // + margin
            positions[tech.id] = {x, y};

            const reqMet = tech.requirements.every(req => gameState.researched.includes(req));
            const isDone = gameState.researched.includes(tech.id);
            // Show if it's done, or if requirements are met, or if it's a direct child of a done/available tech (simple logic: reqs met -> available)
            const isAvailable = reqMet;
            const isVisible = isDone || isAvailable || tech.requirements.some(r => gameState.researched.includes(r)); // Peek next

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

    // Draw Lines
    allResearch.forEach(tech => {
        if (!positions[tech.id]) return;

        // Check visibility of this node to decide if we draw lines TO it
        const reqMet = tech.requirements.every(r => gameState.researched.includes(r));
        const isDone = gameState.researched.includes(tech.id);
        const isVisible = isDone || reqMet || tech.requirements.some(r => gameState.researched.includes(r));

        if (isVisible) {
            tech.requirements.forEach(reqId => {
                if (positions[reqId]) {
                    const start = positions[reqId];
                    const end = positions[tech.id];

                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", start.x + 150); // right side of node
                    line.setAttribute("y1", start.y + 30); // center
                    line.setAttribute("x2", end.x); // left side of node
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
