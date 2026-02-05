import Foundation

struct PrestigeState: Codable {
    var symbolsOfEra: Int = 0 // SE валюта
    var perks: [PrestigePerk] = PrestigePerk.defaultPerks

    // Суммарные эффекты
    var manualMultiplier: Double { 1.0 + perks.filter { $0.kind == .manual }.reduce(0.0) { $0 + $1.currentBonusValue } }
    var autoMultiplier: Double { 1.0 + perks.filter { $0.kind == .auto }.reduce(0.0) { $0 + $1.currentBonusValue } }
    var shopDiscount: Double { perks.filter { $0.kind == .discount }.reduce(0.0) { $0 + $1.currentBonusValue } }
    var critChanceBonus: Double { perks.filter { $0.kind == .critChance }.reduce(0.0) { $0 + $1.currentBonusValue } }
    var critMultiplierBonus: Double { perks.filter { $0.kind == .critMult }.reduce(0.0) { $0 + $1.currentBonusValue } }
}

struct PrestigePerk: Identifiable, Codable {
    enum Kind: String, Codable { case manual, auto, discount, critChance, critMult }

    let id: String
    let title: String
    let description: String
    let kind: Kind
    let baseCost: Int
    let bonusPerLevel: Double // как доля: 0.05 = +5%
    var level: Int = 0

    var currentCost: Int {
        Int(Double(baseCost) * pow(1.5, Double(level)))
    }

    var currentBonusValue: Double { Double(level) * bonusPerLevel }
}

extension PrestigePerk {
    static var defaultPerks: [PrestigePerk] = [
        PrestigePerk(id: "p.manual.1", title: "+Ручной клик", description: "+5% к ручным кликам за уровень", kind: .manual, baseCost: 5, bonusPerLevel: 0.05),
        PrestigePerk(id: "p.auto.1", title: "+Авто-CPS", description: "+5% к авто-CPS за уровень", kind: .auto, baseCost: 5, bonusPerLevel: 0.05),
        PrestigePerk(id: "p.discount.1", title: "Скидка в магазине", description: "-2% к ценам за уровень", kind: .discount, baseCost: 8, bonusPerLevel: 0.02),
        PrestigePerk(id: "p.crit.chance", title: "Крит-шанс", description: "+1% к шансу крита за уровень", kind: .critChance, baseCost: 10, bonusPerLevel: 0.01),
        PrestigePerk(id: "p.crit.mult", title: "Крит-множитель", description: "+10% к силе крита за уровень", kind: .critMult, baseCost: 12, bonusPerLevel: 0.10)
    ]
}
