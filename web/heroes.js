// heroes.js

export const HEROES = [
    // Scientists
    { id: "h_newton", name: "Isaac Newton", title: "Physicist", icon: "🍎", type: "scientist", bonus: { type: "production_mult", resource: "knowledge", value: 1.5 }, desc: "+50% Knowledge" },
    { id: "h_curie", name: "Marie Curie", title: "Chemist", icon: "⚗️", type: "scientist", bonus: { type: "production_mult", resource: "knowledge", value: 1.5 }, desc: "+50% Knowledge" },
    { id: "h_einstein", name: "Albert Einstein", title: "Theorist", icon: "👅", type: "scientist", bonus: { type: "production_mult", resource: "knowledge", value: 2.0 }, desc: "+100% Knowledge" },

    // Generals
    { id: "h_caesar", name: "Julius Caesar", title: "Emperor", icon: "👑", type: "general", bonus: { type: "army_power", value: 1.2 }, desc: "+20% Army Power" },
    { id: "h_napoleon", name: "Napoleon", title: "Commander", icon: "💂", type: "general", bonus: { type: "army_power", value: 1.3 }, desc: "+30% Army Power" },
    { id: "h_sun_tzu", name: "Sun Tzu", title: "Strategist", icon: "📜", type: "general", bonus: { type: "army_power", value: 1.5 }, desc: "+50% Army Power" },

    // Artists (Culture)
    { id: "h_da_vinci", name: "Leonardo da Vinci", title: "Polymath", icon: "🎨", type: "artist", bonus: { type: "production_mult", resource: "culture", value: 1.5 }, desc: "+50% Culture" },
    { id: "h_shakespeare", name: "Shakespeare", title: "Playwright", icon: "🎭", type: "artist", bonus: { type: "production_mult", resource: "culture", value: 1.5 }, desc: "+50% Culture" },

    // Merchants (Money)
    { id: "h_mansa_musa", name: "Mansa Musa", title: "King of Gold", icon: "💰", type: "merchant", bonus: { type: "production_mult", resource: "money", value: 2.0 }, desc: "+100% Money" },
    { id: "h_rockefeller", name: "Rockefeller", title: "Tycoon", icon: "🛢️", type: "merchant", bonus: { type: "production_mult", resource: "money", value: 1.5 }, desc: "+50% Money" }
];

export function generateGPP(gameState, dt) {
    if (!gameState.heroes) gameState.heroes = { owned: [], gpp: 0, threshold: 1000 };

    // Base gain based on Era and Labs/Culture
    let gain = 1; // Base

    // Labs contribute to GPP
    if (gameState.buildings["Lab"]) {
        gain += gameState.buildings["Lab"].count * 0.1;
    }

    // Culture resource contributes
    gain += (gameState.resources.culture || 0) * 0.0001;

    gameState.heroes.gpp += gain * dt;
}

export function recruitHero(gameState) {
    if (!gameState.heroes) return null;
    if (gameState.heroes.gpp < gameState.heroes.threshold) return null;

    // Filter unowned
    const available = HEROES.filter(h => !gameState.heroes.owned.some(oh => oh.id === h.id));
    if (available.length === 0) return null; // All collected

    // Pick random
    const hero = available[Math.floor(Math.random() * available.length)];

    // Deduct
    gameState.heroes.gpp -= gameState.heroes.threshold;
    gameState.heroes.threshold *= 1.5; // Cost scales

    gameState.heroes.owned.push(hero);
    return hero;
}

export function getHeroMultiplier(gameState, type, resource) {
    let mult = 1.0;
    if (!gameState.heroes || !gameState.heroes.owned) return mult;

    gameState.heroes.owned.forEach(h => {
        if (h.bonus.type === type && (!h.bonus.resource || h.bonus.resource === resource)) {
            mult *= h.bonus.value;
        }
        // Army power is handled separately usually, but if we use generic multiplier logic:
        if (type === "army_power" && h.bonus.type === "army_power") {
             mult *= h.bonus.value;
        }
    });
    return mult;
}
