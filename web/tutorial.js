// tutorial.js
// Manage First Time User Experience (FTUE) and contextual hints

export const TUTORIALS = {
    "start_game": {
        title: "Welcome to History Clicker!",
        text: "Your journey begins in the Stone Age. \n\n1. Click the BIG BUTTON to gather resources.\n2. Buy 'AutoClicker' to automate production.\n3. Research technologies to advance Eras.",
        trigger: (state) => state.resources.totalClicks < 10 && !state.tutorials.includes("start_game")
    },
    "first_building": {
        title: "Automation Started",
        text: "You bought your first building! It will generate resources automatically over time. Buy more to increase your Clicks per Second (CpS).",
        trigger: (state) => state.stats.buildingsBought >= 1 && !state.tutorials.includes("first_building")
    },
    "unlock_bronze": {
        title: "The Bronze Age",
        text: "You have advanced to a new Era! \n\nNew tabs unlocked:\n- <b>Expeditions</b>: Send units to find loot.",
        trigger: (state) => state.era === "Bronze Age" && !state.tutorials.includes("unlock_bronze")
    },
    "unlock_iron": {
        title: "The Iron Age",
        text: "You have reached the Iron Age! \n\nNew tabs unlocked:\n- <b>War</b>: Train an army to fight rivals.\n- <b>Crafting</b>: Create powerful items.\n- <b>Market</b>: Trade resources for Money.",
        trigger: (state) => state.era === "Iron Age" && !state.tutorials.includes("unlock_iron")
    },
    "unlock_middle": {
        title: "The Middle Ages",
        text: "You have entered the Middle Ages! \n\nNew tabs unlocked:\n- <b>Government</b>: Choose a ruler style.\n- <b>Heroes</b>: Recruit legendary figures.\n- <b>Wonders</b>: Build massive monuments.\n- <b>Religion</b>: Found a faith.",
        trigger: (state) => state.era === "Middle Ages" && !state.tutorials.includes("unlock_middle")
    },
    "unlock_space": {
        title: "The Final Frontier",
        text: "Welcome to the Future! The <b>Space</b> tab allows you to colonize new worlds. Look for 'Terraforming' options to boost their output.",
        trigger: (state) => state.era === "Future Age" && !state.tutorials.includes("unlock_space")
    }
};

export function initTutorials(state) {
    if (!state.tutorials) {
        state.tutorials = []; // List of completed tutorial IDs
    }
}

export function checkTutorials(state) {
    initTutorials(state);

    // Check all definitions
    for (let id in TUTORIALS) {
        const tut = TUTORIALS[id];
        if (tut.trigger(state)) {
            showTutorialModal(id, tut);
            state.tutorials.push(id);
            break; // Show one at a time
        }
    }
}

function showTutorialModal(id, content) {
    if (document.getElementById("tutorial-modal")) return;

    const modal = document.createElement("div");
    modal.id = "tutorial-modal";
    modal.className = "modal-overlay";

    modal.innerHTML = `
        <div class="modal-content tutorial-content">
            <h3>💡 ${content.title}</h3>
            <p>${content.text}</p>
            <div class="tutorial-actions">
                <button onclick="closeTutorial('${id}')">Got it!</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

window.closeTutorial = function(id) {
    const el = document.getElementById("tutorial-modal");
    if (el) document.body.removeChild(el);
    // Already marked as done in state check, but we could save here if needed.
    window.saveGame();
};

// Contextual Help System
export const HELP_TOPICS = {
    "market": "Buy low, sell high! Stocks change price every 5 seconds. Use 'Trade' to convert resources into Money.",
    "war": "Train units to increase Army Power. Attack rivals to steal loot. Be careful: you will lose units in battle!",
    "dynasty": "Your ruler ages and eventually dies. Heirs inherit the throne. Traits give global bonuses (e.g. +10% Culture).",
    "diplomacy": "Improve relations to prevent wars, or use Spies to steal technology. World Congress allows voting on global rules.",
    "prestige": "Reset your progress to gain 'Symbols of Era'. These unlock permanent upgrades in the Ascension Tree. Essential for late game!",
    "research": "Unlock new technologies to advance through Eras, unlock buildings, and gain powerful bonuses.",
    "expeditions": "Send explorers to find resources, money, and rare Relics. Higher risk expeditions offer better rewards but might fail.",
    "crafting": "Combine raw materials to create useful items and permanent buffs. Recipes unlock as you discover new resources.",
    "heroes": "Recruit Great People using GPP. Heroes provide unique, powerful passive bonuses to your civilization.",
    "government": "Choose a government type that suits your playstyle. Enact policies to fine-tune your empire's bonuses.",
    "achievements": "Track your milestones. Unlocking achievements grants small permanent bonuses to production.",
    "wonders": "Build massive monuments for huge global bonuses. Each Wonder can only be built once per run.",
    "governors": "Hire Governors to automate tasks and boost specific industries. Don't forget to toggle them ON!",
    "religion": "Found a faith to unify your people. Adopt Dogmas to gain bonuses to Happiness, War, or Economy.",
    "space": "Colonize planets to expand your empire beyond Earth. Terraforming increases planetary output."
};

window.showHelp = function(topic) {
    const text = HELP_TOPICS[topic] || "No help available.";
    alert(`❓ HELP: ${topic.toUpperCase()}\n\n${text}`);
};
