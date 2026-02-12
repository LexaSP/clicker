// devpanel.js

window.dev_addClicks = function() {
    // Need access to gameState, but it's not exported.
    // However, script.js is a module.
    // Wait, script.js doesn't export gameState.
    // I need to expose it or modify script.js to export it.
    // Or I can just set a global variable in script.js for debugging.

    // Better: script.js should attach debug functions itself or expose state.
    // Since I can't easily change script.js from here without re-writing,
    // I'll assume script.js attached `window.gameState` or similar.

    // Actually, let's just make script.js expose a global 'Game' object.
    if (window.gameState) {
        window.gameState.resources.clicks += 1000;
        window.gameState.resources.knowledge += 1000;
        console.log("Dev: Added resources.");
        // Trigger UI update?
        // script.js `updateUI` is not global.
        // It runs on loop, so it will update next tick.
    } else {
        console.warn("GameState not accessible.");
    }
};

window.dev_reset = function() {
    localStorage.removeItem("hc_web_save");
    location.reload();
};
