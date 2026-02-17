// espionage.js
// Manage spies and covert operations

export const SPY_MISSIONS = [
    { id: "gather_intel", name: "Gather Intel", cost: 100, duration: 10, difficulty: 10, reward: { type: "knowledge", value: 500 } },
    { id: "siphon_funds", name: "Siphon Funds", cost: 500, duration: 30, difficulty: 30, reward: { type: "money", value: 2000 } },
    { id: "steal_tech", name: "Steal Technology", cost: 1000, duration: 60, difficulty: 50, reward: { type: "tech_boost", value: 1 } },
    { id: "sabotage", name: "Sabotage Industry", cost: 2000, duration: 45, difficulty: 40, reward: { type: "weaken_rival", value: 0.2 } }, // Reduce rival power
    { id: "assassinate", name: "Assassinate General", cost: 5000, duration: 120, difficulty: 70, reward: { type: "chaos", value: 0.5 } }
];

export function initEspionage(state) {
    if (!state.espionage) {
        state.espionage = {
            spies: [], // { id, name, level, status: 'idle'|'mission', missionEnd: 0 }
            maxSpies: 3,
            nextSpyId: 1
        };
    }
}

export function trainSpy(state) {
    initEspionage(state);
    const esp = state.espionage;

    if (esp.spies.length >= esp.maxSpies) return { success: false, msg: "Max spies reached." };

    const cost = 1000 * Math.pow(2, esp.spies.length);
    if (state.resources.money < cost) return { success: false, msg: `Need ${cost} Money.` };

    state.resources.money -= cost;
    esp.spies.push({
        id: esp.nextSpyId++,
        name: `Agent ${Math.floor(Math.random() * 999)}`,
        level: 1,
        xp: 0,
        status: 'idle',
        mission: null,
        missionEnd: 0
    });

    return { success: true, msg: "Spy trained!" };
}

export function startMission(state, spyId, missionId) {
    const esp = state.espionage;
    const spy = esp.spies.find(s => s.id === spyId);
    if (!spy || spy.status !== 'idle') return { success: false, msg: "Spy busy or not found." };

    const mission = SPY_MISSIONS.find(m => m.id === missionId);
    if (state.resources.money < mission.cost) return { success: false, msg: "Not enough funds for mission." };

    state.resources.money -= mission.cost;
    spy.status = 'mission';
    spy.mission = missionId;
    spy.missionEnd = Date.now() + (mission.duration * 1000);

    return { success: true, msg: `Mission started: ${mission.name}` };
}

export function updateEspionage(state) {
    initEspionage(state); // Ensure init
    if (!state.espionage) return;

    const now = Date.now();
    const completed = [];

    state.espionage.spies.forEach(spy => {
        if (spy.status === 'mission' && now >= spy.missionEnd) {
            // Complete
            const mission = SPY_MISSIONS.find(m => m.id === spy.mission);
            completeMission(state, spy, mission);
            completed.push({ spy: spy.name, mission: mission.name });
            spy.status = 'idle';
            spy.mission = null;
        }
    });

    return completed;
}

function completeMission(state, spy, mission) {
    // Success Check
    // Base chance 50% + (Level * 10) - Difficulty
    const chance = 50 + (spy.level * 10) - mission.difficulty;
    const roll = Math.random() * 100;

    if (roll < chance) {
        // Success
        spy.xp += mission.difficulty;
        if (spy.xp >= 100 * spy.level) {
            spy.level++;
            spy.xp = 0;
        }

        // Grant Reward
        if (mission.reward.type === "knowledge") state.resources.knowledge += mission.reward.value;
        if (mission.reward.type === "money") state.resources.money += mission.reward.value;
        if (mission.reward.type === "tech_boost") {
            // Grant random 10% progress on a tech? Or just knowledge.
            state.resources.knowledge += 5000;
        }
        if (mission.reward.type === "weaken_rival") {
             // Weaken random rival?
             // Need access to RIVALS or just a global "rival_weakness" modifier?
             // Let's store a temporary debuff in state
             state.rivalWeakness = (state.rivalWeakness || 0) + mission.reward.value;
        }

        console.log(`Mission Success: ${mission.name}`);
        alert(`🕵️ Mission SUCCESS: ${mission.name}\nAgent ${spy.name} returned safely.`);
    } else {
        // Fail
        // Risk of capture (death)?
        if (Math.random() < 0.2) {
            // Spy Killed
            const idx = state.espionage.spies.indexOf(spy);
            state.espionage.spies.splice(idx, 1);
            alert(`🕵️ Mission FAILED: ${mission.name}\nAgent ${spy.name} was KILLED in action.`);
        } else {
            alert(`🕵️ Mission FAILED: ${mission.name}\nAgent ${spy.name} escaped but failed the objective.`);
        }
    }
}
