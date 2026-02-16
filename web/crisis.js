// crisis.js

export const CRISIS_STAGES = [
    { threshold: 0, name: "Dormant", desc: "The galaxy is quiet." },
    { threshold: 25, name: "Awakening", desc: "Strange signals are coming from the Void." },
    { threshold: 50, name: "Incursion", desc: "Void entities are attacking outer colonies." },
    { threshold: 75, name: "Invasion", desc: "The Void Fleet has arrived in the system." },
    { threshold: 100, name: "Annihilation", desc: "The End is here." }
];

export function checkCrisis(gameState, dt) {
    if (!gameState.crisis) gameState.crisis = { active: false, threat: 0, defeated: false };

    // Trigger condition: Future Age + Space unlocked
    if (gameState.era === "Future Age" && gameState.space && gameState.space.planets.length > 0 && !gameState.crisis.defeated) {
        if (!gameState.crisis.active) {
            gameState.crisis.active = true;
            alert("⚠️ WARNING: The Void has noticed your expansion. A Crisis is approaching!");
        }

        // Threat increases over time
        // 100% in 30 minutes (1800s) -> 0.05 per sec
        gameState.crisis.threat += 0.05 * dt;
        if (gameState.crisis.threat > 100) gameState.crisis.threat = 100;

        if (gameState.crisis.threat >= 100) {
            // Game Over Logic usually goes here, but we'll just cap it and nag the player
            // Or force prestige.
        }
    }
}

export function fightCrisis(gameState) {
    if (!gameState.crisis || !gameState.crisis.active) return "No active crisis.";

    // Require resources/army
    if (gameState.resources.knowledge < 5000 || gameState.resources.money < 5000) {
        return "Need 5000 Knowledge and Money to launch counter-offensive.";
    }

    // Check Army Power
    let power = 0;
    if (gameState.army) {
        // Need space-capable units or just raw power?
        // Let's assume Tanks/Mechs contribute
        power = Object.values(gameState.army).reduce((a, b) => a + b, 0) * 10; // Simplified
    }

    if (power < 1000) return "Army too weak (Need 1000+ Power).";

    // Deduct
    gameState.resources.knowledge -= 5000;
    gameState.resources.money -= 5000;

    // Reduce Threat
    const damage = 10 + Math.random() * 10;
    gameState.crisis.threat -= damage;
    if (gameState.crisis.threat < 0) gameState.crisis.threat = 0;

    if (gameState.crisis.threat <= 0 && gameState.crisis.active) {
        gameState.crisis.defeated = true;
        gameState.crisis.active = false;
        gameState.resources.symbolsOfEra += 10;
        return "VICTORY! The Void has been pushed back forever. +10 Symbols of Era.";
    }

    return `Counter-offensive launched! Threat reduced by ${Math.floor(damage)}%.`;
}
