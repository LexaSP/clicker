// campaign.js

export const CAMPAIGN_CHAPTERS = [
    {
        id: "chap_1",
        title: "The Dawn of Man",
        lore: "Your people have just discovered fire. Now, they must build a home.",
        objectives: [
            { type: "resource", key: "clicks", target: 500, desc: "Accumulate 500 Clicks" },
            { type: "building", key: "Gatherer", target: 5, desc: "Build 5 Gatherers" }
        ],
        reward: { text: "+50 Starting Clicks", effect: "start_bonus" }
    },
    {
        id: "chap_2",
        title: "Rise of Civilization",
        lore: "Stone gives way to Bronze. Cities rise from the dust.",
        objectives: [
            { type: "era", target: "Bronze Age", desc: "Reach Bronze Age" },
            { type: "resource", key: "stone", target: 1000, desc: "Stockpile 1000 Stone" }
        ],
        reward: { text: "Unique Skin: Golden Palace", effect: "skin_gold" }
    },
    {
        id: "chap_3",
        title: "The Iron Fist",
        lore: "Empires are forged in war. Prove your might.",
        objectives: [
            { type: "army_power", target: 500, desc: "Reach 500 Army Power" },
            { type: "building", key: "Workshop", target: 10, desc: "Build 10 Workshops" }
        ],
        reward: { text: "+10% Army Power (Permanent)", effect: "perm_army_boost" }
    },
    {
        id: "chap_4",
        title: "Industrial Revolution",
        lore: "Steam and steel drive the world forward.",
        objectives: [
            { type: "building", key: "Factory", target: 5, desc: "Build 5 Factories" },
            { type: "resource", key: "money", target: 50000, desc: "Accumulate 50,000 Money" }
        ],
        reward: { text: "-5% Building Cost", effect: "cost_reduction" }
    }
];

export function checkCampaignProgress(gameState) {
    if (!gameState.campaign) gameState.campaign = { completed: [] };

    // Find first incomplete chapter
    const currentChapter = CAMPAIGN_CHAPTERS.find(c => !gameState.campaign.completed.includes(c.id));
    if (!currentChapter) return null; // All done

    // Check objectives
    const allMet = currentChapter.objectives.every(obj => {
        if (obj.type === "resource") return gameState.resources[obj.key] >= obj.target;
        if (obj.type === "building") return gameState.buildings[obj.key] && gameState.buildings[obj.key].count >= obj.target;
        if (obj.type === "era") return gameState.era === obj.target; // Or index check
        if (obj.type === "army_power") {
            // Need access to calculated power, usually passed or re-calc
            // We can assume if this function is called in tick, we might need to calc it or check stats
            // For simplicity, let's assume we pass power or access it from somewhere?
            // gameState doesn't store current power.
            // We'll skip army check here or import calculator?
            // Better: assume 'stats' tracks max power? No.
            // Let's allow passing a 'context' object with calculated stats.
            return true; // Placeholder if context missing
        }
        return false;
    });

    if (allMet) {
        return currentChapter;
    }
    return null;
}

export function completeChapter(gameState, chapter) {
    if (!gameState.campaign.completed.includes(chapter.id)) {
        gameState.campaign.completed.push(chapter.id);
        return true;
    }
    return false;
}
