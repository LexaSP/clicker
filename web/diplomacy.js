// diplomacy.js

export const RIVAL_NATIONS = [
    { id: "north_kingdom", name: "Northern Kingdom", strength: 100, disposition: 50, resources: "wood" },
    { id: "south_empire", name: "Southern Empire", strength: 500, disposition: 20, resources: "stone" },
    { id: "east_dynasty", name: "Eastern Dynasty", strength: 200, disposition: 80, resources: "knowledge" },
    { id: "west_republic", name: "Western Republic", strength: 300, disposition: 60, resources: "money" }
];

export function getDiplomacyState(gameState) {
    if (!gameState.diplomacy) {
        gameState.diplomacy = {};
        RIVAL_NATIONS.forEach(n => {
            gameState.diplomacy[n.id] = {
                relation: n.disposition, // 0-100 (0=War, 100=Ally)
                status: "Neutral",
                tradeDeal: null
            };
        });
    }
    return gameState.diplomacy;
}

export function interactDiplomacy(gameState, nationId, action) {
    const diplo = getDiplomacyState(gameState);
    const nation = RIVAL_NATIONS.find(n => n.id === nationId);
    const state = diplo[nationId];

    if (!nation || !state) return { success: false, msg: "Nation not found." };

    if (action === "insult") {
        state.relation -= 20;
        if (state.relation <= 0) {
            state.relation = 0;
            state.status = "War";
            return { success: true, msg: "You insulted them! WAR DECLARED!" };
        }
        return { success: true, msg: "They are offended. Relations dropped." };
    }

    if (action === "improve") {
        if (gameState.resources.money >= 500) {
            gameState.resources.money -= 500;
            state.relation += 10;
            if (state.relation > 100) state.relation = 100;
            return { success: true, msg: "Gift sent. Relations improved." };
        }
        return { success: false, msg: "Need 500 Money." };
    }

    if (action === "alliance") {
        if (state.relation >= 80) {
            state.status = "Ally";
            return { success: true, msg: "Alliance formed! They will help in wars." };
        }
        return { success: false, msg: "Relations too low (Need 80+)." };
    }

    if (action === "trade_agreement") {
        if (state.relation >= 50) {
            state.tradeDeal = true;
            return { success: true, msg: "Trade Route established! (+Passive Income)" };
        }
        return { success: false, msg: "Relations too low (Need 50+)." };
    }

    return { success: false, msg: "Unknown action." };
}

export function updateDiplomacy(gameState, dt) {
    const diplo = getDiplomacyState(gameState);

    // Decay relations slightly towards 50
    // Generate trade income
    for (let id in diplo) {
        const d = diplo[id];
        if (d.tradeDeal) {
            // Passive income based on nation resource
            const nation = RIVAL_NATIONS.find(n => n.id === id);
            if (gameState.resources[nation.resources] !== undefined) {
                gameState.resources[nation.resources] += 1 * dt;
            }
        }
    }
}
