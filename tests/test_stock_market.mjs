
import { updateStockMarket, triggerMarketEvent, COMPANIES, initStockMarket } from '../web/stock_market.js';

const state = {
    resources: { money: 10000 },
    stockMarket: null
};

// Initialize
initStockMarket(state);
console.log("Initial State initialized.");

// Force initial prices to be exactly Base Price
COMPANIES.forEach(c => {
    state.stockMarket.stocks[c.id].currentPrice = c.basePrice;
    state.stockMarket.stocks[c.id].history = [c.basePrice];
});

// Helper to run simulation
// dt = 0.1s
function runSim(ticks, dt = 0.1) {
    for (let i = 0; i < ticks; i++) {
        updateStockMarket(state, dt);
    }
}

// 1. Baseline Run
console.log("\n--- Baseline Run (10 ticks / 1s) ---");
runSim(10);
COMPANIES.forEach(c => {
    const stock = state.stockMarket.stocks[c.id];
    console.log(`${c.name} (${c.industry}): ${stock.currentPrice.toFixed(2)} (Momentum: ${stock.momentum.toFixed(4)})`);
});

// 2. Trigger War
console.log("\n--- Triggering War Declared (Duration 10s) ---");
triggerMarketEvent(state, "War Declared", 10);

// Run for a bit to see impact
// 2 seconds = 20 ticks
runSim(20);
console.log("After 2 seconds of War:");
COMPANIES.forEach(c => {
    const stock = state.stockMarket.stocks[c.id];
    let status = "";
    if (c.industry === "Military") status = "(Expected UP)";
    if (c.industry === "Food") status = "(Expected DOWN)";
    console.log(`${c.name} (${c.industry}): ${stock.currentPrice.toFixed(2)} ${status}`);
});

// 3. Trigger Crisis
console.log("\n--- Triggering Economic Crisis (Duration 10s) ---");
triggerMarketEvent(state, "Economic Crisis", 10);
// Note: War is still active? Yes, duration was 10s. We ran 2s. So 8s left.
// Crisis stacks.

runSim(20); // Another 2 seconds
console.log("After 2 seconds of Crisis + War:");
COMPANIES.forEach(c => {
    const stock = state.stockMarket.stocks[c.id];
    console.log(`${c.name}: ${stock.currentPrice.toFixed(2)}`);
});

// 4. Verify History
console.log("\n--- History Check ---");
const acme = state.stockMarket.stocks["acme"];
console.log(`Acme History Length: ${acme.history.length}`);
// We ran 10 + 20 + 20 = 50 ticks = 5 seconds (dt=0.1).
// History updates every 1s. So should be around 5 entries.
console.log(`History: ${acme.history.map(x => x.toFixed(2)).join(", ")}`);
