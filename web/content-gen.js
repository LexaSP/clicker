// content-gen.js — полный рерайт системы контента

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const RELIC_ICONS = ["🗿","🏺","🔮","⚔️","🛡️","💍","📜","👑","🏰","🏛️","💎","🧿","🗝️","⚱️","🖼️","🗡️","🏹","⛏️","🔭","⚖️"];
const relicPrefixes = ["Ancient","Lost","Cursed","Divine","Broken","Glowing","Rusty","Golden","Crystal","Shadow","Ethereal","Time-worn","Forgotten","Mystic","Arcane","Cosmic","Primeval","Void","Solar","Lunar","Infernal","Celestial","Radiant","Spectral","Runed","Enchanted","Holy","Dark","Faded","Legendary"];
const relicNames = ["Shard","Totem","Amulet","Ring","Tablet","Coin","Crown","Scepter","Orb","Gem","Fragment","Idol","Mask","Chalice","Dagger","Scroll","Key","Mirror","Compass","Beacon","Pendant","Bracelet","Gauntlet","Statue","Urn","Prism","Tome","Wand","Staff","Medallion"];
const relicSuffixes = ["of Power","of Time","of Greed","of Wisdom","of Speed","of Shadows","of Light","of Fire","of the Ancients","of the Stars","of Eternity","of Destiny","of Life","of War","of the Dragon","of the Phoenix","of Truth","of Chaos","of Order","of Hope"];

export function generateRelics() {
    const relics = [];
    let idCounter = 1;
    for (let p of relicPrefixes) {
        for (let n of relicNames) {
            for (let s of relicSuffixes) {
                if (relics.length >= 300) break;
                const name = `${p} ${n} ${s}`;
                const rarity = randomChoice(["Common","Common","Uncommon","Uncommon","Rare","Epic","Legendary"]);
                let effectType = randomChoice(["click_boost","production_boost","cost_reduction","crit_chance","crit_damage"]);
                let effectValue = { Common:randomInt(1,5), Uncommon:randomInt(5,15), Rare:randomInt(15,30), Epic:randomInt(30,60), Legendary:randomInt(60,100) }[rarity];
                relics.push({ id:`relic_${idCounter++}`, name, icon:randomChoice(RELIC_ICONS), rarity, effect:{type:effectType,value:effectValue}, description:`A ${rarity.toLowerCase()} relic granting +${effectValue}% ${effectType.replace(/_/g,' ')}.` });
            }
            if (relics.length >= 300) break;
        }
        if (relics.length >= 300) break;
    }
    return relics;
}

export function generateResearch() {
    return [
        // STONE AGE
        { id:"tech_fire",       name:"Fire Discovery",    icon:"🔥", era:"Stone Age",       cost:50,            costType:"knowledge", requirements:[],                                        effectDesc:"+30% Food",           effect:{ type:"production_mult", resource:"food",   value:1.3 } },
        { id:"tech_tools",      name:"Stone Tools",       icon:"🪨", era:"Stone Age",       cost:80,            costType:"knowledge", requirements:["tech_fire"],                             effectDesc:"+25% click value",    effect:{ type:"click_mult",                         value:1.25 } },
        { id:"tech_hunting",    name:"Hunting Tactics",   icon:"🏹", era:"Stone Age",       cost:120,           costType:"knowledge", requirements:["tech_tools"],                            effectDesc:"+40% Food",           effect:{ type:"production_mult", resource:"food",   value:1.4 } },
        { id:"tech_shelter",    name:"Shelter Building",  icon:"🛖", era:"Stone Age",       cost:150,           costType:"knowledge", requirements:["tech_tools"],                            effectDesc:"+5 max pop",          effect:{ type:"housing_bonus",                      value:5 } },
        { id:"tech_language",   name:"Basic Language",    icon:"🗣️", era:"Stone Age",       cost:200,           costType:"knowledge", requirements:["tech_hunting","tech_shelter"],           effectDesc:"+0.5 Know/s",         effect:{ type:"knowledge_flat",                     value:0.5 } },
        { id:"tech_pottery",    name:"Pottery",           icon:"🏺", era:"Stone Age",       cost:250,           costType:"knowledge", requirements:["tech_fire","tech_shelter"],              effectDesc:"+50% storage",        effect:{ type:"storage_mult",                       value:1.5 } },
        { id:"tech_tribe",      name:"Tribal Hierarchy",  icon:"👥", era:"Stone Age",       cost:300,           costType:"knowledge", requirements:["tech_language"],                         effectDesc:"🔓 Government",       effect:{ type:"unlock_tab",      tab:"tab-btn-government" } },
        { id:"tech_cave_art",   name:"Cave Painting",     icon:"🎨", era:"Stone Age",       cost:350,           costType:"knowledge", requirements:["tech_language"],                         effectDesc:"+0.3 Culture/s",      effect:{ type:"culture_flat",                       value:0.3 } },
        { id:"tech_wheel",      name:"The Wheel",         icon:"⚙️", era:"Stone Age",       cost:500,           costType:"knowledge", requirements:["tech_pottery","tech_tribe"],             effectDesc:"+50% all production", effect:{ type:"production_mult", resource:"clicks", value:1.5 } },

        // BRONZE AGE
        { id:"tech_bronze",     name:"Bronze Smelting",   icon:"⚔️", era:"Bronze Age",     cost:800,           costType:"knowledge", requirements:["tech_wheel"],                            effectDesc:"+30% production",     effect:{ type:"production_mult", resource:"clicks", value:1.3 } },
        { id:"tech_agriculture",name:"Agriculture",        icon:"🌾", era:"Bronze Age",     cost:900,           costType:"knowledge", requirements:["tech_wheel"],                            effectDesc:"🔓 Farm",             effect:{ type:"building_unlock", building:"Farm" } },
        { id:"tech_writing",    name:"Writing",            icon:"📜", era:"Bronze Age",     cost:1200,          costType:"knowledge", requirements:["tech_cave_art","tech_bronze"],           effectDesc:"+50% Knowledge",      effect:{ type:"knowledge_mult",                     value:1.5 } },
        { id:"tech_masonry",    name:"Masonry",            icon:"🧱", era:"Bronze Age",     cost:1500,          costType:"knowledge", requirements:["tech_bronze"],                           effectDesc:"-15% build costs",    effect:{ type:"building_cost_reduction",            value:0.85 } },
        { id:"tech_trade",      name:"Trade Routes",       icon:"🛒", era:"Bronze Age",     cost:2000,          costType:"knowledge", requirements:["tech_writing","tech_masonry"],           effectDesc:"🔓 Market",           effect:{ type:"unlock_tab",      tab:"tab-btn-trade" } },
        { id:"tech_currency",   name:"Currency",           icon:"💰", era:"Bronze Age",     cost:2500,          costType:"culture",   requirements:["tech_trade"],                            effectDesc:"+100% Money",         effect:{ type:"money_mult",                         value:2.0 } },
        { id:"tech_sailing",    name:"Sailing",            icon:"⛵", era:"Bronze Age",     cost:3000,          costType:"knowledge", requirements:["tech_trade"],                            effectDesc:"🔓 Expeditions",      effect:{ type:"unlock_tab",      tab:"tab-btn-expeditions" } },
        { id:"tech_citystates", name:"City States",        icon:"🏛️", era:"Bronze Age",     cost:3500,          costType:"culture",   requirements:["tech_writing","tech_agriculture"],       effectDesc:"+20 max pop",         effect:{ type:"housing_bonus",                      value:20 } },
        { id:"tech_astronomy",  name:"Astronomy",          icon:"⭐", era:"Bronze Age",     cost:4000,          costType:"knowledge", requirements:["tech_writing"],                          effectDesc:"+2 Know/s",           effect:{ type:"knowledge_flat",                     value:2.0 } },
        { id:"tech_mathematics",name:"Mathematics",        icon:"🔢", era:"Bronze Age",     cost:5000,          costType:"knowledge", requirements:["tech_astronomy","tech_currency"],        effectDesc:"-20% all costs",      effect:{ type:"building_cost_reduction",            value:0.8 } },

        // IRON AGE
        { id:"tech_iron",       name:"Iron Forging",       icon:"🔨", era:"Iron Age",       cost:8000,          costType:"knowledge", requirements:["tech_mathematics"],                      effectDesc:"+40% production",     effect:{ type:"production_mult", resource:"clicks", value:1.4 } },
        { id:"tech_roads",      name:"Roads",              icon:"🛤️", era:"Iron Age",       cost:10000,         costType:"knowledge", requirements:["tech_iron","tech_masonry"],              effectDesc:"+50% Money",          effect:{ type:"money_mult",                         value:1.5 } },
        { id:"tech_philosophy", name:"Philosophy",         icon:"🧠", era:"Iron Age",       cost:12000,         costType:"culture",   requirements:["tech_writing"],                          effectDesc:"+2 Culture/s",        effect:{ type:"culture_flat",                       value:2.0 } },
        { id:"tech_democracy",  name:"Democracy",          icon:"🗳️", era:"Iron Age",       cost:15000,         costType:"culture",   requirements:["tech_philosophy","tech_citystates"],     effectDesc:"+40% Knowledge",      effect:{ type:"knowledge_mult",                     value:1.4 } },
        { id:"tech_aqueducts",  name:"Aqueducts",          icon:"💧", era:"Iron Age",       cost:18000,         costType:"knowledge", requirements:["tech_roads","tech_masonry"],             effectDesc:"🔓 Aqueduct",         effect:{ type:"building_unlock", building:"Aqueduct" } },
        { id:"tech_alphabet",   name:"Alphabet",           icon:"🔤", era:"Iron Age",       cost:20000,         costType:"knowledge", requirements:["tech_philosophy"],                       effectDesc:"+60% Knowledge",      effect:{ type:"knowledge_mult",                     value:1.6 } },
        { id:"tech_legions",    name:"Legions",            icon:"🛡️", era:"Iron Age",       cost:25000,         costType:"culture",   requirements:["tech_iron","tech_democracy"],            effectDesc:"🔓 War tab",          effect:{ type:"unlock_tab",      tab:"tab-btn-war" } },
        { id:"tech_concrete",   name:"Concrete",           icon:"🏗️", era:"Iron Age",       cost:30000,         costType:"knowledge", requirements:["tech_aqueducts"],                        effectDesc:"+50% production",     effect:{ type:"production_mult", resource:"clicks", value:1.5 } },
        { id:"tech_paper",      name:"Paper",              icon:"📄", era:"Iron Age",       cost:35000,         costType:"knowledge", requirements:["tech_alphabet"],                         effectDesc:"+5 Know/s",           effect:{ type:"knowledge_flat",                     value:5.0 } },
        { id:"tech_compass",    name:"Compass",            icon:"🧭", era:"Iron Age",       cost:40000,         costType:"knowledge", requirements:["tech_sailing","tech_paper"],             effectDesc:"Expeditions 2x faster",effect:{ type:"expedition_speed",                   value:0.5 } },

        // MIDDLE AGES
        { id:"tech_feudalism",  name:"Feudalism",          icon:"🏰", era:"Middle Ages",    cost:60000,         costType:"culture",   requirements:["tech_legions"],                          effectDesc:"+100% Food",          effect:{ type:"production_mult", resource:"food",   value:2.0 } },
        { id:"tech_guilds",     name:"Guilds",             icon:"⚒️", era:"Middle Ages",    cost:80000,         costType:"culture",   requirements:["tech_currency","tech_feudalism"],        effectDesc:"🔓 Crafting",         effect:{ type:"unlock_tab",      tab:"tab-btn-crafting" } },
        { id:"tech_universities",name:"Universities",      icon:"🎓", era:"Middle Ages",    cost:100000,        costType:"knowledge", requirements:["tech_paper","tech_guilds"],              effectDesc:"🔓 University",       effect:{ type:"building_unlock", building:"University" } },
        { id:"tech_crop_rot",   name:"Crop Rotation",      icon:"🌱", era:"Middle Ages",    cost:120000,        costType:"knowledge", requirements:["tech_feudalism"],                        effectDesc:"+200% Food",          effect:{ type:"production_mult", resource:"food",   value:3.0 } },
        { id:"tech_windmills",  name:"Windmills",          icon:"💨", era:"Middle Ages",    cost:150000,        costType:"knowledge", requirements:["tech_crop_rot"],                         effectDesc:"+60% production",     effect:{ type:"production_mult", resource:"clicks", value:1.6 } },
        { id:"tech_alchemy",    name:"Alchemy",            icon:"⚗️", era:"Middle Ages",    cost:180000,        costType:"knowledge", requirements:["tech_universities"],                     effectDesc:"+10% relic chance",   effect:{ type:"relic_chance",                       value:0.1 } },
        { id:"tech_gunpowder",  name:"Gunpowder",          icon:"💥", era:"Middle Ages",    cost:220000,        costType:"knowledge", requirements:["tech_alchemy","tech_legions"],           effectDesc:"+50% Army Power",     effect:{ type:"army_mult",                          value:1.5 } },
        { id:"tech_banking",    name:"Banking",            icon:"🏦", era:"Middle Ages",    cost:280000,        costType:"culture",   requirements:["tech_guilds","tech_universities"],        effectDesc:"🔓 Bank",             effect:{ type:"building_unlock", building:"Bank" } },
        { id:"tech_printing",   name:"Printing Press",     icon:"🖨️", era:"Middle Ages",    cost:350000,        costType:"knowledge", requirements:["tech_universities","tech_paper"],        effectDesc:"+100% Knowledge",     effect:{ type:"knowledge_mult",                     value:2.0 } },
        { id:"tech_heroes_age", name:"Epic Chronicles",    icon:"🦸", era:"Middle Ages",    cost:400000,        costType:"culture",   requirements:["tech_printing","tech_feudalism"],        effectDesc:"🔓 Heroes",           effect:{ type:"unlock_tab",      tab:"tab-btn-heroes" } },

        // RENAISSANCE
        { id:"tech_humanism",   name:"Humanism",           icon:"🎭", era:"Renaissance",    cost:600000,        costType:"culture",   requirements:["tech_printing","tech_heroes_age"],       effectDesc:"+100% Culture",       effect:{ type:"culture_mult",                       value:2.0 } },
        { id:"tech_sci_method", name:"Scientific Method",  icon:"🔬", era:"Renaissance",    cost:800000,        costType:"knowledge", requirements:["tech_printing"],                         effectDesc:"+150% Knowledge",     effect:{ type:"knowledge_mult",                     value:2.5 } },
        { id:"tech_telescope",  name:"Telescope",          icon:"🔭", era:"Renaissance",    cost:1000000,       costType:"knowledge", requirements:["tech_sci_method"],                       effectDesc:"+20 Know/s",          effect:{ type:"knowledge_flat",                     value:20.0 } },
        { id:"tech_helio",      name:"Heliocentrism",      icon:"☀️", era:"Renaissance",    cost:1200000,       costType:"knowledge", requirements:["tech_telescope","tech_sci_method"],      effectDesc:"+50% all production", effect:{ type:"production_mult", resource:"clicks", value:1.5 } },
        { id:"tech_anatomy",    name:"Anatomy",            icon:"🫀", era:"Renaissance",    cost:1500000,       costType:"knowledge", requirements:["tech_sci_method"],                       effectDesc:"+50 max pop",         effect:{ type:"housing_bonus",                      value:50 } },
        { id:"tech_exploration",name:"Age of Exploration", icon:"🗺️", era:"Renaissance",    cost:2000000,       costType:"culture",   requirements:["tech_sailing","tech_compass","tech_humanism"], effectDesc:"Expedition x2",    effect:{ type:"expedition_mult",                    value:2.0 } },
        { id:"tech_mercantilism",name:"Mercantilism",      icon:"📊", era:"Renaissance",    cost:2500000,       costType:"culture",   requirements:["tech_exploration","tech_banking"],       effectDesc:"+100% Money",         effect:{ type:"money_mult",                         value:2.0 } },
        { id:"tech_clockwork",  name:"Clockwork",          icon:"⏰", era:"Renaissance",    cost:3000000,       costType:"knowledge", requirements:["tech_sci_method"],                       effectDesc:"Automation 50% faster",effect:{ type:"automation_speed",                  value:1.5 } },
        { id:"tech_diplomacy_ren",name:"Diplomacy",        icon:"🤝", era:"Renaissance",    cost:3500000,       costType:"culture",   requirements:["tech_mercantilism","tech_humanism"],     effectDesc:"🔓 Diplomacy",        effect:{ type:"unlock_tab",      tab:"tab-btn-diplomacy" } },
        { id:"tech_muskets",    name:"Muskets",            icon:"🔫", era:"Renaissance",    cost:4000000,       costType:"knowledge", requirements:["tech_gunpowder","tech_clockwork"],       effectDesc:"+100% Army Power",    effect:{ type:"army_mult",                          value:2.0 } },

        // INDUSTRIAL AGE
        { id:"tech_steam",      name:"Steam Engine",       icon:"♨️", era:"Industrial Age", cost:8000000,       costType:"knowledge", requirements:["tech_clockwork","tech_muskets"],          effectDesc:"+100% production",    effect:{ type:"production_mult", resource:"clicks", value:2.0 } },
        { id:"tech_factory_t",  name:"Factory System",     icon:"🏭", era:"Industrial Age", cost:12000000,      costType:"knowledge", requirements:["tech_steam"],                            effectDesc:"🔓 Factory",          effect:{ type:"building_unlock", building:"Factory" } },
        { id:"tech_railroads",  name:"Railroads",          icon:"🚂", era:"Industrial Age", cost:15000000,      costType:"knowledge", requirements:["tech_steam","tech_roads"],               effectDesc:"+150% Money",         effect:{ type:"money_mult",                         value:2.5 } },
        { id:"tech_telegraph",  name:"Telegraph",          icon:"📡", era:"Industrial Age", cost:18000000,      costType:"knowledge", requirements:["tech_railroads"],                        effectDesc:"+50 Know/s",          effect:{ type:"knowledge_flat",                     value:50.0 } },
        { id:"tech_steel",      name:"Steel Production",   icon:"🔩", era:"Industrial Age", cost:22000000,      costType:"knowledge", requirements:["tech_factory_t"],                        effectDesc:"-30% build costs",    effect:{ type:"building_cost_reduction",            value:0.7 } },
        { id:"tech_electricity",name:"Electricity",        icon:"⚡", era:"Industrial Age", cost:30000000,      costType:"knowledge", requirements:["tech_telegraph","tech_steel"],            effectDesc:"🔓 Power Plant",      effect:{ type:"building_unlock", building:"PowerPlant" } },
        { id:"tech_assembly",   name:"Assembly Line",      icon:"🔄", era:"Industrial Age", cost:40000000,      costType:"knowledge", requirements:["tech_electricity"],                      effectDesc:"+150% production",    effect:{ type:"production_mult", resource:"clicks", value:2.5 } },
        { id:"tech_vaccines",   name:"Vaccines",           icon:"💉", era:"Industrial Age", cost:50000000,      costType:"knowledge", requirements:["tech_anatomy","tech_factory_t"],         effectDesc:"+200 max pop",        effect:{ type:"housing_bonus",                      value:200 } },
        { id:"tech_governors_t",name:"Management Science", icon:"👔", era:"Industrial Age", cost:60000000,      costType:"culture",   requirements:["tech_assembly","tech_railroads"],        effectDesc:"🔓 Governors",        effect:{ type:"unlock_tab",      tab:"tab-btn-governors" } },
        { id:"tech_radio",      name:"Radio",              icon:"📻", era:"Industrial Age", cost:75000000,      costType:"knowledge", requirements:["tech_electricity"],                      effectDesc:"+200% Culture",       effect:{ type:"culture_mult",                       value:3.0 } },

        // MODERN AGE
        { id:"tech_flight",     name:"Flight",             icon:"✈️", era:"Modern Age",     cost:120000000,     costType:"knowledge", requirements:["tech_assembly"],                         effectDesc:"Expedition x3",       effect:{ type:"expedition_mult",                    value:3.0 } },
        { id:"tech_nuclear",    name:"Nuclear Power",      icon:"☢️", era:"Modern Age",     cost:200000000,     costType:"knowledge", requirements:["tech_electricity","tech_flight"],        effectDesc:"+400% Energy",        effect:{ type:"production_mult", resource:"energy", value:5.0 } },
        { id:"tech_transistors",name:"Transistors",        icon:"💡", era:"Modern Age",     cost:300000000,     costType:"knowledge", requirements:["tech_nuclear"],                          effectDesc:"+200% Knowledge",     effect:{ type:"knowledge_mult",                     value:3.0 } },
        { id:"tech_lab_t",      name:"Research Labs",      icon:"🧪", era:"Modern Age",     cost:400000000,     costType:"knowledge", requirements:["tech_transistors"],                      effectDesc:"🔓 Lab",              effect:{ type:"building_unlock", building:"Lab" } },
        { id:"tech_dna",        name:"DNA Structure",      icon:"🧬", era:"Modern Age",     cost:500000000,     costType:"knowledge", requirements:["tech_lab_t"],                            effectDesc:"Relics 50% better",   effect:{ type:"relic_quality",                      value:1.5 } },
        { id:"tech_internet",   name:"Internet",           icon:"🌐", era:"Modern Age",     cost:700000000,     costType:"knowledge", requirements:["tech_transistors"],                      effectDesc:"+200 Know/s",         effect:{ type:"knowledge_flat",                     value:200.0 } },
        { id:"tech_cabinet",    name:"Cabinet System",     icon:"🏛️", era:"Modern Age",     cost:800000000,     costType:"culture",   requirements:["tech_governors_t","tech_radio"],         effectDesc:"🔓 Cabinet",          effect:{ type:"unlock_tab",      tab:"tab-btn-cabinet" } },
        { id:"tech_robotics",   name:"Robotics",           icon:"🤖", era:"Modern Age",     cost:1000000000,    costType:"knowledge", requirements:["tech_transistors","tech_assembly"],      effectDesc:"+200% production",    effect:{ type:"production_mult", resource:"clicks", value:3.0 } },
        { id:"tech_congress_t", name:"World Congress",     icon:"🗺️", era:"Modern Age",     cost:1200000000,    costType:"culture",   requirements:["tech_internet","tech_cabinet"],          effectDesc:"🔓 World Congress",   effect:{ type:"unlock_tab",      tab:"tab-btn-congress" } },
        { id:"tech_solar",      name:"Solar Power",        icon:"🌞", era:"Modern Age",     cost:1500000000,    costType:"knowledge", requirements:["tech_nuclear","tech_robotics"],           effectDesc:"+200% Energy",        effect:{ type:"production_mult", resource:"energy", value:3.0 } },

        // INFORMATION AGE
        { id:"tech_ai",         name:"Artificial Intelligence",icon:"🤖",era:"Information Age",cost:3000000000, costType:"knowledge", requirements:["tech_internet","tech_robotics"],          effectDesc:"+300% production",    effect:{ type:"production_mult", resource:"clicks", value:4.0 } },
        { id:"tech_quantum",    name:"Quantum Computing",   icon:"⚛️", era:"Information Age",cost:5000000000,  costType:"knowledge", requirements:["tech_ai"],                               effectDesc:"+400% Knowledge",     effect:{ type:"knowledge_mult",                     value:5.0 } },
        { id:"tech_nanotech",   name:"Nanotechnology",      icon:"🔬", era:"Information Age",cost:8000000000,  costType:"knowledge", requirements:["tech_quantum","tech_dna"],               effectDesc:"-50% build costs",    effect:{ type:"building_cost_reduction",            value:0.5 } },
        { id:"tech_supercomp",  name:"Supercomputers",      icon:"🖥️", era:"Information Age",cost:12000000000, costType:"knowledge", requirements:["tech_quantum"],                          effectDesc:"🔓 Supercomputer",    effect:{ type:"building_unlock", building:"Supercomputer" } },
        { id:"tech_biotech",    name:"Biotechnology",       icon:"🧫", era:"Information Age",cost:15000000000, costType:"knowledge", requirements:["tech_nanotech","tech_dna"],              effectDesc:"+1000 max pop",       effect:{ type:"housing_bonus",                      value:1000 } },
        { id:"tech_mars",       name:"Mars Colony",         icon:"🔴", era:"Information Age",cost:20000000000, costType:"knowledge", requirements:["tech_ai","tech_solar"],                  effectDesc:"🔓 Space tab",        effect:{ type:"unlock_space_tab" } },
        { id:"tech_cybernetics",name:"Cybernetics",         icon:"🦾", era:"Information Age",cost:30000000000, costType:"knowledge", requirements:["tech_biotech","tech_ai"],                effectDesc:"+400% click value",   effect:{ type:"click_mult",                         value:5.0 } },
        { id:"tech_vr",         name:"Virtual Reality",     icon:"🥽", era:"Information Age",cost:40000000000, costType:"culture",   requirements:["tech_ai","tech_supercomp"],              effectDesc:"+400% Culture",       effect:{ type:"culture_mult",                       value:5.0 } },
        { id:"tech_renewable",  name:"Renewable Revolution",icon:"♻️", era:"Information Age",cost:50000000000, costType:"knowledge", requirements:["tech_solar","tech_nanotech"],            effectDesc:"Upkeep halved",       effect:{ type:"upkeep_reduction",                   value:0.5 } },
        { id:"tech_singularity",name:"Singularity Prep",    icon:"🌌", era:"Information Age",cost:100000000000,costType:"knowledge", requirements:["tech_quantum","tech_cybernetics","tech_vr"], effectDesc:"Prestige SE x2",   effect:{ type:"prestige_bonus",                     value:2.0 } },

        // FUTURE AGE
        { id:"tech_fusion",     name:"Fusion Power",        icon:"☀️", era:"Future Age",     cost:200000000000, costType:"knowledge", requirements:["tech_singularity"],                      effectDesc:"🔓 Fusion Reactor",   effect:{ type:"building_unlock", building:"FusionReactor" } },
        { id:"tech_antigrav",   name:"Anti-Gravity",        icon:"🛸", era:"Future Age",     cost:400000000000, costType:"knowledge", requirements:["tech_fusion"],                           effectDesc:"+400% production",    effect:{ type:"production_mult", resource:"clicks", value:5.0 } },
        { id:"tech_terraform",  name:"Terraforming",        icon:"🪐", era:"Future Age",     cost:600000000000, costType:"knowledge", requirements:["tech_fusion","tech_mars"],               effectDesc:"Space prod x3",       effect:{ type:"space_mult",                         value:3.0 } },
        { id:"tech_ftl",        name:"FTL Travel",          icon:"🚀", era:"Future Age",     cost:1000000000000,costType:"knowledge", requirements:["tech_antigrav","tech_terraform"],        effectDesc:"+900% production",    effect:{ type:"production_mult", resource:"clicks", value:10.0 } },
        { id:"tech_dyson",      name:"Dyson Sphere",        icon:"⭕", era:"Future Age",     cost:2000000000000,costType:"knowledge", requirements:["tech_ftl"],                              effectDesc:"Energy x100",         effect:{ type:"production_mult", resource:"energy", value:100.0 } },
        { id:"tech_immortality",name:"Immortality",         icon:"∞",  era:"Future Age",     cost:5000000000000,costType:"knowledge", requirements:["tech_biotech","tech_cybernetics","tech_dyson"], effectDesc:"Prestige SE x5", effect:{ type:"prestige_bonus",                     value:5.0 } },
        { id:"tech_ascension",  name:"Ascension",           icon:"🌟", era:"Future Age",     cost:10000000000000,costType:"knowledge",requirements:["tech_immortality","tech_ftl"],           effectDesc:"🏆 VICTORY",          effect:{ type:"trigger_victory" } },
    ];
}

const ideaVerbs = ["Study","Analyze","Synthesize","Experiment","Theorize","Observe","Calculate","Simulate","Explore","Invent"];
const ideaNouns = ["Nature","Physics","Chemistry","Biology","Society","Economics","Philosophy","Art","Music","History","Math","Logic","Space","Time","Matter","Energy","Life","Mind","Soul","Void"];
const ideaModifiers = ["Basic","Advanced","Complex","Abstract","Applied","Theoretical","Quantum","Meta","Hyper","Neo"];

export function generateIdeas() {
    const ideas = [];
    let idCounter = 1;
    for (let v of ideaVerbs) {
        for (let n of ideaNouns) {
            for (let m of ideaModifiers) {
                if (ideas.length >= 350) break;
                ideas.push({ id:`idea_${idCounter++}`, name:`${m} ${v} of ${n}`, cost:{ knowledge:randomInt(10,1000) }, effect:{ type:"inspiration_boost", value:randomInt(1,10) } });
            }
            if (ideas.length >= 350) break;
        }
        if (ideas.length >= 350) break;
    }
    return ideas;
}

const locations = ["Forest","Cave","Mountain","Desert","Ocean","Ruins","Temple","Dungeon","Castle","City","Sky","Space","Dimension","Timeline","Void"];
const locationIcons = { "Forest":"🌲","Cave":"🦇","Mountain":"🏔️","Desert":"🌵","Ocean":"🌊","Ruins":"🏛️","Temple":"🕌","Dungeon":"🕸️","Castle":"🏰","City":"🏙️","Sky":"☁️","Space":"🚀","Dimension":"🌀","Timeline":"⏳","Void":"⚫" };

export function generateExpeditions() {
    const expeditions = [];
    let idCounter = 1;
    locations.forEach(loc => {
        const types = [
            { name:"Short",  duration:120,   mult:1.0 },
            { name:"Medium", duration:600,   mult:0.8 },
            { name:"Long",   duration:3600,  mult:0.6 },
            { name:"Epic",   duration:14400, mult:0.5 }
        ];
        types.forEach(type => {
            let resourceType = "food";
            if (loc === "Forest") resourceType = "wood";
            if (loc === "Mountain" || loc === "Cave") resourceType = "stone";
            if (loc === "Desert") resourceType = "relicShards";
            const risk = randomInt(10,75);
            const riskBonus = 1 + (risk/100)*3;
            const durationRatio = type.duration / 120;
            const lootAmount = Math.floor(50 * durationRatio * type.mult * riskBonus);
            expeditions.push({
                id:`exp_${idCounter++}`, name:`${type.name} Expedition to ${loc}`,
                icon: locationIcons[loc] || "🗺️", duration: type.duration,
                difficulty:`${risk}% Risk`, risk, cost:{ food: Math.max(5, Math.floor(10 * durationRatio)) },
                rewards:{ relics:(risk>50 && Math.random()<0.5)?1:0, money:Math.floor(100*durationRatio*type.mult), loot:{ type:resourceType, amount:lootAmount } }
            });
        });
    });
    return expeditions;
}

export function generateRecipes() {
    return [
        { id:"craft_tool",    name:"Steel Tools",     icon:"⛏️", inputs:{ steel:50,   wood:100  }, output:{ type:"crafted", name:"Steel Tools",     rarity:"Common",    effect:{ type:"cost_reduction",       value:5   }, desc:"Reduces all building costs by 5%." } },
        { id:"craft_sword",   name:"Officer's Sword", icon:"⚔️", inputs:{ steel:100,  iron:200  }, output:{ type:"crafted", name:"Officer's Sword",  rarity:"Uncommon",  effect:{ type:"army_power",            value:0.5 }, desc:"+50% Army Power." } },
        { id:"craft_crown",   name:"Jeweled Crown",   icon:"👑", inputs:{ money:5000             }, output:{ type:"crafted", name:"Jeweled Crown",    rarity:"Rare",      effect:{ type:"happiness_boost",       value:0.2 }, desc:"+20% Happiness." } },
        { id:"craft_battery", name:"High-Cap Battery",icon:"🔋", inputs:{ energy:5000,stone:1000 }, output:{ type:"crafted", name:"High-Cap Battery", rarity:"Epic",      effect:{ type:"production_multiplier", value:1.5 }, desc:"+50% global production." } },
        { id:"craft_lens",    name:"Crystal Lens",    icon:"🔭", inputs:{ stone:500,  money:2000 }, output:{ type:"crafted", name:"Crystal Lens",     rarity:"Uncommon",  effect:{ type:"knowledge_boost",       value:20  }, desc:"+20 Knowledge/sec." } },
        { id:"craft_codex",   name:"Ancient Codex",   icon:"📜", inputs:{ wood:1000, knowledge:5000 }, output:{ type:"crafted", name:"Ancient Codex",  rarity:"Rare",      effect:{ type:"production_boost",      value:25  }, desc:"+25% production." } },
        { id:"craft_reactor", name:"Micro Reactor",   icon:"⚛️", inputs:{ uranium:100,steel:500  }, output:{ type:"crafted", name:"Micro Reactor",    rarity:"Legendary", effect:{ type:"production_multiplier", value:3.0 }, desc:"x3 all production." } },
    ];
}
