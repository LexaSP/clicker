// modding.js
// Allow players to inject custom content via JSON
// RESTRICTION: Only available in NG+ (Transcended). Disables Leaderboards.

export function renderModdingMenu(state) {
    // 1. Check Condition (Game+ / Transcendence)
    if (!state.stats || !state.stats.transcendenceCount || state.stats.transcendenceCount < 1) {
        alert("🔒 Modding is restricted to New Game+ (after Transcendence).");
        return;
    }

    if (document.getElementById("mod-modal")) return;

    const modal = document.createElement("div");
    modal.id = "mod-modal";
    modal.className = "modal-overlay";

    modal.innerHTML = `
        <div class="modal-content" style="width: 600px; border: 2px solid #e74c3c;">
            <h2>🛠️ Modding Engine (Beta)</h2>
            <div style="background: #c0392b; color: white; padding: 10px; margin-bottom: 10px; font-weight: bold;">
                ⚠️ WARNING: Applying mods will flag your save as "MODDED".<br>
                You will be disqualified from all Leaderboards.
            </div>
            <p>Inject custom content (JSON).</p>
            <textarea id="mod-input" style="width:100%; height:200px; background:#222; color:#fff;" placeholder='{"civs": [...], "techs": [...]}'></textarea>
            <br>
            <button onclick="applyMod()">Load Mod & Disable Leaderboards</button>
            <button onclick="document.body.removeChild(document.getElementById('mod-modal'))" style="background:#7f8c8d;">Cancel</button>
            <hr>
            <h4>Example JSON</h4>
            <pre style="text-align:left; font-size:10px; background:#111; padding:5px;">
{
  "techs": [
    {
      "id": "cheat_tech", "name": "Cheat Code",
      "cost": 1, "effect": { "type": "production_multiplier", "value": 100 },
      "era": "Stone Age", "requirements": []
    }
  ]
}
            </pre>
        </div>
    `;

    document.body.appendChild(modal);
}

window.applyMod = function() {
    if (!confirm("Are you sure? This will PERMANENTLY exclude this save from Leaderboards.")) return;

    const input = document.getElementById("mod-input").value;
    try {
        const mod = JSON.parse(input);
        let log = "Mod Loaded:\n";

        // Flag as Modded
        window.gameState.isModded = true;

        if (mod.techs && window.allResearch) {
            mod.techs.forEach(t => {
                // Basic validation
                if (!t.id || !t.name) return;
                window.allResearch.push(t);
                log += `+ Tech: ${t.name}\n`;
            });
            window.renderResearchTree(); // Refresh
        }

        // Add other handlers (civs, buildings) as needed

        log += "\n🛑 LEADERBOARDS DISABLED.";
        alert(log);
        document.body.removeChild(document.getElementById("mod-modal"));
        window.updateUI(); // Refresh UI to maybe show "Modded" tag

    } catch (e) {
        alert("Error parsing JSON: " + e.message);
    }
};
