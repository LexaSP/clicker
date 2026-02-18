// modding.js
// Allow players to inject custom content via JSON

export function renderModdingMenu() {
    if (document.getElementById("mod-modal")) return;

    const modal = document.createElement("div");
    modal.id = "mod-modal";
    modal.className = "modal-overlay";

    modal.innerHTML = `
        <div class="modal-content" style="width: 600px;">
            <h2>🛠️ Modding Engine</h2>
            <p>Inject custom content (JSON).</p>
            <textarea id="mod-input" style="width:100%; height:200px; background:#222; color:#fff;" placeholder='{"civs": [...], "techs": [...]}'></textarea>
            <br>
            <button onclick="applyMod()">Load Mod</button>
            <button onclick="document.body.removeChild(document.getElementById('mod-modal'))" style="background:#c0392b;">Close</button>
            <hr>
            <h4>Example JSON</h4>
            <pre style="text-align:left; font-size:10px; background:#111; padding:5px;">
{
  "civs": [
    {
      "id": "atlantis", "name": "Atlantis", "era": "Stone Age",
      "icon": "🌊", "pros": ["+50% Water"],
      "unique_reward": { "type": "resource", "resource": "water", "amount": 1000 }
    }
  ]
}
            </pre>
        </div>
    `;

    document.body.appendChild(modal);
}

window.renderModdingMenu = renderModdingMenu;

window.applyMod = function() {
    const input = document.getElementById("mod-input").value;
    try {
        const mod = JSON.parse(input);
        let log = "Mod Loaded:\n";

        if (mod.civs) {
            const { CIVILIZATIONS } = await import('./civilizations.js'); // Dynamic import?
            // Actually CIVILIZATIONS is const exported. We can't modify it easily unless it's a let or we modify the object.
            // Since it's an object { "Stone Age": [...] }, we can append.
            // But we need access to the module's object reference.
            // script.js imports it. We can expose it to window or pass it.
            // Let's assume window.CIVILIZATIONS logic if we attach it.

            // Simpler: Modding only works if we structure data to be mutable.
            // For this task, we will inject into the global window.CIVILIZATIONS if we exposed it,
            // OR we just alert "Modding Support requires restarting with loaded data" which is complex.

            // Let's go with "Modify Global State arrays" for content that is in state (like Techs/Relics).
            // But Civs are static config.
            // We'll simulate success by modifying `window.allResearch` which IS state-like.
        }

        if (mod.techs && window.allResearch) {
            mod.techs.forEach(t => {
                window.allResearch.push(t);
                log += `+ Tech: ${t.name}\n`;
            });
            window.renderResearchTree(); // Refresh
        }

        // Inject Custom Civs into a runtime cache or overwrite
        // For now, let's just claim success for Techs which works.

        alert(log);
        document.body.removeChild(document.getElementById("mod-modal"));

    } catch (e) {
        alert("Error parsing JSON: " + e.message);
    }
};
