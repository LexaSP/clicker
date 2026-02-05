import SwiftUI
import Combine

private enum PersistKeys {
    static let clicks = "hc.clicks"
    static let bestRecord = "hc.bestRecord"
    static let currentEraIndex = "hc.currentEraIndex"
    static let legacyMultiplier = "hc.legacyMultiplier"
    static let legacyStartClicks = "hc.legacyStartClicks"
    static let upgradesLevelsPrefix = "hc.upgrade.levels."
    static let lastActiveDate = "hc.lastActiveDate"
    static let prestige = "hc.prestige"
}

// MARK: - Models
struct Upgrade: Identifiable, Hashable {
    let id = UUID()
    let title: String
    let description: String
    let baseCost: Int
    let autoClicksPerSecGain: Double
    var level: Int = 0

    func currentCost(for level: Int) -> Int {
        let factor = pow(1.25, Double(max(level, 0)))
        return Int(Double(baseCost) * factor)
    }

    func totalAutoCps(for level: Int) -> Double {
        Double(level) * autoClicksPerSecGain
    }
}

struct Era: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let emoji: String
    let color: Color
    let threshold: Int // сколько артефактов нужно, чтобы перейти в следующую эпоху
    var upgrades: [Upgrade]
}

// MARK: - View
struct ContentView: View {
    // MARK: - State
    @State private var clicks = 0
    @State private var isAnimating = false
    @State private var showEraFlash = false
    @State private var bonusText: String? = nil
    @State private var cps: Double = 0
    @State private var bestRecord: Int = 0

    // Эры
    @State private var eras: [Era] = ContentView.defaultEras
    @State private var currentEraIndex: Int = 0

    // Авто-клики
    @State private var autoCps: Double = 0 // авто кликов в секунду (с учетом мультипликатора наследия)
    @State private var autoTimer: Timer? = nil

    // Магазин
    @State private var showShop = false

    // Ручные CPS
    @State private var cpsSamples: [Date] = []

    // Наследие: переносимый мультипликатор и стартовые артефакты при переходе эпох
    @State private var legacyMultiplier: Double = 1.0
    @State private var legacyStartClicks: Int = 0
    @State private var lastActiveDate: Date? = nil
    @State private var prestige = PrestigeState()
    @State private var showPrestige = false

    var body: some View {
        ZStack {
            currentEra.color.opacity(0.06).ignoresSafeArea()

            VStack(spacing: 24) {
                header
                progressSection

                Spacer(minLength: 12)

                artifactButton
                    .padding(.vertical, 8)

                Spacer(minLength: 12)

                controls
                footerHint
            }
            .padding(.horizontal)

            if showEraFlash {
                currentEra.color.opacity(0.18)
                    .ignoresSafeArea()
                    .transition(.opacity)
            }

            if let bonusText {
                Text(bonusText)
                    .font(.headline)
                    .padding(10)
                    .background(.ultraThinMaterial, in: Capsule())
                    .overlay(Capsule().stroke(currentEra.color.opacity(0.6), lineWidth: 1))
                    .foregroundStyle(currentEra.color)
                    .shadow(radius: 4)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .offset(y: -180)
            }
        }
        .tint(currentEra.color)
        .onAppear {
            loadState()
            applyOfflineGainsIfNeeded()
            loadBestRecord()
            startAutoTimer()
            if legacyStartClicks > 0 { clicks += legacyStartClicks; legacyStartClicks = 0 }
            recalcAutoCps()
            saveState()
        }
        .onDisappear { saveState(); stopAutoTimer() }
        .onChange(of: clicks) { _, newValue in updateBestRecordIfNeeded(newValue) }
        .sheet(isPresented: $showShop) { shopView.presentationDetents([.medium, .large]) }
        .sheet(isPresented: $showPrestige) {
            PrestigeTreeView(state: $prestige) { saveState(); recalcAutoCps() }
                .presentationDetents([.medium, .large])
        }
    }

    // MARK: - Persistence & Offline
    private func saveState() {
        let ud = UserDefaults.standard
        ud.set(clicks, forKey: PersistKeys.clicks)
        ud.set(bestRecord, forKey: PersistKeys.bestRecord)
        ud.set(currentEraIndex, forKey: PersistKeys.currentEraIndex)
        ud.set(legacyMultiplier, forKey: PersistKeys.legacyMultiplier)
        ud.set(legacyStartClicks, forKey: PersistKeys.legacyStartClicks)
        // Save upgrades levels for current era and all eras
        for (eraIdx, era) in eras.enumerated() {
            for (upIdx, up) in era.upgrades.enumerated() {
                ud.set(up.level, forKey: PersistKeys.upgradesLevelsPrefix + "\(eraIdx).\(upIdx)")
            }
        }
        ud.set(Date(), forKey: PersistKeys.lastActiveDate)
        if let data = try? JSONEncoder().encode(prestige) {
            ud.set(data, forKey: PersistKeys.prestige)
        }
    }

    private func loadState() {
        let ud = UserDefaults.standard
        if ud.object(forKey: PersistKeys.currentEraIndex) != nil {
            clicks = ud.integer(forKey: PersistKeys.clicks)
            bestRecord = ud.integer(forKey: PersistKeys.bestRecord)
            currentEraIndex = ud.integer(forKey: PersistKeys.currentEraIndex)
            legacyMultiplier = ud.object(forKey: PersistKeys.legacyMultiplier) as? Double ?? 1.0
            legacyStartClicks = ud.integer(forKey: PersistKeys.legacyStartClicks)
            // Load upgrade levels
            for eraIdx in eras.indices {
                for upIdx in eras[eraIdx].upgrades.indices {
                    let key = PersistKeys.upgradesLevelsPrefix + "\(eraIdx).\(upIdx)"
                    let lvl = ud.integer(forKey: key)
                    eras[eraIdx].upgrades[upIdx].level = lvl
                }
            }
        }
        lastActiveDate = ud.object(forKey: PersistKeys.lastActiveDate) as? Date
        if let data = ud.data(forKey: PersistKeys.prestige),
           let s = try? JSONDecoder().decode(PrestigeState.self, from: data) {
            prestige = s
        }
    }

    private func applyOfflineGainsIfNeeded() {
        guard let last = lastActiveDate else { return }
        let elapsed = Date().timeIntervalSince(last)
        // Cap at 12 hours
        let capped = min(elapsed, 12 * 60 * 60)
        guard capped > 1 else { return }
        // Доход = автоCps * время
        recalcAutoCps()
        let gain = Int(autoCps * capped)
        if gain > 0 {
            clicks += gain
            showBonus("Оффлайн +\(gain)")
        }
    }

    // MARK: - Subviews
    private var header: some View {
        VStack(spacing: 6) {
            Text("Исторический кликер")
                .font(.title2.bold())
                .foregroundStyle(.primary)
                .transition(.opacity.combined(with: .scale))
            HStack(spacing: 8) {
                Text(currentEra.emoji).font(.title)
                Text("Эпоха: \(currentEra.name)")
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }
            Text("Артефакты: \(clicks)")
                .font(.system(size: 50, weight: .black, design: .monospaced))
                .foregroundStyle(currentEra.color)
                .animation(.easeInOut(duration: 0.15), value: clicks)
        }
        .padding(.top, 24)
    }

    private var progressSection: some View {
        VStack(spacing: 10) {
            ProgressView(value: progressToNextEra)
                .tint(currentEra.color)
            HStack(alignment: .firstTextBaseline) {
                Text("До следующей эпохи: \(remainingToNextEra)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(String(format: "Ручные CPS: %.1f", cps))
                        .font(.caption.monospaced())
                        .foregroundStyle(.secondary)
                    Text(String(format: "Авто CPS: %.1f", autoCps))
                        .font(.caption.monospaced())
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var artifactButton: some View {
        Button(action: { doManualClick() }) {
            Text(currentEra.emoji)
                .font(.system(size: 140))
                .scaleEffect(isAnimating ? 0.82 : 1.0)
                .rotationEffect(.degrees(isAnimating ? -10 : 0))
                .shadow(color: currentEra.color.opacity(isAnimating ? 0.5 : 0.2), radius: isAnimating ? 16 : 6, x: 0, y: 6)
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.2, dampingFraction: 0.45), value: isAnimating)
    }

    private var controls: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                Button { showShop = true } label: { Label("Магазин", systemImage: "cart.fill") }
                    .buttonStyle(.borderedProminent)
                    .tint(currentEra.color)
                
                Button { showPrestige = true } label: { Label("Наследие", systemImage: "seal.fill") }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)

                Spacer()

                Button(role: .destructive) { reset() } label: { Label("Сброс", systemImage: "arrow.counterclockwise") }
                    .buttonStyle(.bordered)
                    .tint(.red)
            }

            HStack {
                Label("Рекорд: \(bestRecord)", systemImage: "trophy.fill")
                    .foregroundStyle(.yellow)
                Spacer()
            }
        }
    }

    private var footerHint: some View {
        Text("Жми на артефакт, покупай апгрейды и продвигай цивилизацию через эпохи!")
            .font(.footnote)
            .multilineTextAlignment(.center)
            .padding(.vertical)
            .foregroundStyle(.gray)
    }

    // MARK: - Shop View
    private var shopView: some View {
        NavigationStack {
            List {
                Section(header: Text("Апгрейды эпохи: \(currentEra.name)")) {
                    ForEach(eras[currentEraIndex].upgrades.indices, id: \.self) { i in
                        let up = eras[currentEraIndex].upgrades[i]
                        let rawCost = up.currentCost(for: up.level)
                        let cost = max(1, Int(Double(rawCost) * max(0.0, 1.0 - prestige.shopDiscount)))
                        HStack(alignment: .top, spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(up.title).font(.headline)
                                Text(up.description).font(.caption).foregroundStyle(.secondary)
                                Text(String(format: "+%.1f автокл/с • уровень %d", up.autoClicksPerSecGain, up.level))
                                    .font(.caption2.monospaced())
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            VStack(alignment: .trailing) {
                                Button { buyUpgrade(index: i) } label: { Text("Купить за \(cost)") }
                                    .buttonStyle(.borderedProminent)
                                    .tint(clicks >= cost ? currentEra.color : .gray)
                                    .disabled(clicks < cost)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                }
                Section {
                    Button {
                        tryAdvanceEra()
                    } label: {
                        HStack {
                            Image(systemName: "arrow.right.circle.fill")
                            Text("Перейти в следующую эпоху (нужно: \(currentEra.threshold))")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(currentEra.color)
                    .disabled(clicks < currentEra.threshold)
                } footer: {
                    Text("При переходе: сбрасываются апгрейды, но вы получаете наследие — мультипликатор и стартовые артефакты.")
                }
            }
            .navigationTitle("Магазин")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Text("Артефакты: \(clicks)").font(.subheadline.monospaced()).foregroundStyle(currentEra.color) } }
        }
    }

    // MARK: - Logic
    private func doManualClick() {
        // Ручной клик с перками и критами
        let baseTap = max(1, Int(legacyMultiplier.rounded(.down)))
        let manualMult = prestige.manualMultiplier
        let critChance = 0.03 + prestige.critChanceBonus // базовый 3%
        let critMult = 10.0 * (1.0 + prestige.critMultiplierBonus)
        var gained = Double(baseTap) * manualMult
        if Double.random(in: 0...1) < critChance { gained *= critMult; showBonus("Крит x\(Int(critMult))!") }
        clicks += Int(gained.rounded())

        registerSample()
        animateTap()
        checkEraFlashAtExactThreshold()
        checkBonus()
        hapticImpact()
        saveState()
    }

    private func doAutoClick(ticks: Int) {
        clicks += ticks
        checkEraFlashAtExactThreshold()
        saveState()
    }

    private func animateTap() {
        withAnimation(.spring(response: 0.2, dampingFraction: 0.4)) { isAnimating = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { isAnimating = false }
    }

    private func checkEraFlashAtExactThreshold() {
        if clicks == currentEra.threshold {
            withAnimation(.easeInOut(duration: 0.25)) { showEraFlash = true }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                withAnimation(.easeOut(duration: 0.25)) { showEraFlash = false }
            }
            hapticNotification()
        }
    }

    private func checkBonus() {
        // Бонус каждые 25 кликов: +5 только для ручных кликов
        if clicks % 25 == 0 {
            let bonus = 5
            clicks += bonus
            showBonus("Бонус +\(bonus)!")
        }
    }

    private func showBonus(_ text: String) {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) { bonusText = text }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation(.easeOut(duration: 0.25)) { bonusText = nil }
        }
    }

    // MARK: - Auto CPS Timer
    private func startAutoTimer() {
        stopAutoTimer()
        autoTimer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { _ in
            // Каждые 0.25 сек добавляем четверть авто-CPS
            let perTick = autoCps / 4.0
            let whole = Int(floor(perTick))
            let remainder = perTick - Double(whole)
            var ticks = whole
            if Double.random(in: 0...1) < remainder { ticks += 1 }
            if ticks > 0 { doAutoClick(ticks: ticks) }
        }
    }

    private func stopAutoTimer() { autoTimer?.invalidate(); autoTimer = nil }

    private func reset() {
        clicks = 0
        cpsSamples.removeAll()
        bestRecord = 0
        UserDefaults.standard.set(bestRecord, forKey: "bestRecord")
        // Сброс текущей эпохи и наследия
        currentEraIndex = 0
        eras = ContentView.defaultEras
        legacyMultiplier = 1.0
        legacyStartClicks = 0
        recalcAutoCps()
        saveState()
    }

    // MARK: - Era Advance
    private func tryAdvanceEra() {
        guard clicks >= currentEra.threshold else { return }
        advanceEra()
    }

    private func advanceEra() {
        // Выдать SE за прогресс эпохи
        let se = Int(log10(1.0 + Double(max(clicks, 1))))
        if se > 0 { prestige.symbolsOfEra += se }

        // Рассчитываем наследие: часть накопленного прогресса конвертируем в мультипликатор и стартовые клики
        // Пример формулы: 10% от текущих кликов -> стартовые клики, 1% -> мультипликатор (минимум 1)
        let carryClicks = Int(Double(clicks) * 0.10)
        let carryMultiplier = max(1.0, 1.0 + Double(clicks) * 0.01)

        legacyStartClicks += carryClicks
        legacyMultiplier = max(legacyMultiplier, carryMultiplier)

        // Переходим к следующей эпохе, если есть
        if currentEraIndex < eras.count - 1 {
            currentEraIndex += 1
            // Сброс ресурсов эпохи
            clicks = 0
            // Сброс уровней апгрейдов только для новой эпохи — начнутся с нуля
            for i in eras[currentEraIndex].upgrades.indices { eras[currentEraIndex].upgrades[i].level = 0 }
            showBonus("Новая эпоха: \(currentEra.name) ✨")
            withAnimation(.easeInOut(duration: 0.35)) { showEraFlash = true }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { withAnimation { showEraFlash = false } }
            // Применим стартовые клики от наследия
            clicks += legacyStartClicks
            recalcAutoCps()
            saveState()
        } else {
            // Если эпохи закончились — можно зациклить или расширить позже
            showBonus("Вы достигли вершины истории! 🎉")
        }
    }

    // MARK: - Haptics
    private func hapticImpact() {
        #if os(iOS)
        let impact = UIImpactFeedbackGenerator(style: .medium)
        impact.impactOccurred()
        #endif
    }

    private func hapticNotification() {
        #if os(iOS)
        let gen = UINotificationFeedbackGenerator()
        gen.notificationOccurred(.success)
        #endif
    }

    // MARK: - CPS / Record
    private func registerSample() {
        let now = Date()
        cpsSamples.append(now)
        cpsSamples = cpsSamples.filter { now.timeIntervalSince($0) <= 2.0 }
        let window = now.timeIntervalSince(cpsSamples.first ?? now)
        if window > 0 { cps = Double(cpsSamples.count) / window }
    }

    private func loadBestRecord() { bestRecord = UserDefaults.standard.integer(forKey: "bestRecord") }

    private func updateBestRecordIfNeeded(_ value: Int) {
        if value > bestRecord { bestRecord = value; UserDefaults.standard.set(bestRecord, forKey: "bestRecord") }
    }

    // MARK: - Shop Logic
    private func buyUpgrade(index: Int) {
        guard eras[currentEraIndex].upgrades.indices.contains(index) else { return }
        let level = eras[currentEraIndex].upgrades[index].level
        let rawCost = eras[currentEraIndex].upgrades[index].currentCost(for: level)
        let cost = max(1, Int(Double(rawCost) * max(0.0, 1.0 - prestige.shopDiscount)))
        guard clicks >= cost else { return }
        clicks -= cost
        eras[currentEraIndex].upgrades[index].level += 1
        recalcAutoCps()
        showBonus("Куплено: \(eras[currentEraIndex].upgrades[index].title)")
        saveState()
    }

    private func recalcAutoCps() {
        let base = eras[currentEraIndex].upgrades.reduce(0.0) { $0 + $1.totalAutoCps(for: $1.level) }
        autoCps = base * legacyMultiplier * prestige.autoMultiplier
    }

    // MARK: - Derived
    private var currentEra: Era { eras[currentEraIndex] }

    private var progressToNextEra: Double {
        let end = max(currentEra.threshold, 1)
        let clamped = min(max(clicks, 0), end)
        return Double(clamped) / Double(end)
    }

    private var remainingToNextEra: Int { max(0, currentEra.threshold - clicks) }
}

// MARK: - Default Eras
extension ContentView {
    static var defaultEras: [Era] {
        [
            Era(
                name: "Палеолит",
                emoji: "🪨",
                color: .brown,
                threshold: 50,
                upgrades: [
                    Upgrade(title: "Кремневые орудия", description: "+0.2 автокл/с", baseCost: 20, autoClicksPerSecGain: 0.2),
                    Upgrade(title: "Охотничий отряд", description: "+0.5 автокл/с", baseCost: 45, autoClicksPerSecGain: 0.5),
                    Upgrade(title: "Пещерные рисунки", description: "+1 автокл/с", baseCost: 90, autoClicksPerSecGain: 1.0)
                ]
            ),
            Era(
                name: "Неолит",
                emoji: "🌾",
                color: .green,
                threshold: 150,
                upgrades: [
                    Upgrade(title: "Земледелие", description: "+1 автокл/с", baseCost: 120, autoClicksPerSecGain: 1.0),
                    Upgrade(title: "Приручение животных", description: "+2 автокл/с", baseCost: 220, autoClicksPerSecGain: 2.0),
                    Upgrade(title: "Глиняные сосуды", description: "+3 автокл/с", baseCost: 320, autoClicksPerSecGain: 3.0)
                ]
            ),
            Era(
                name: "Античность",
                emoji: "🏛️",
                color: .teal,
                threshold: 400,
                upgrades: [
                    Upgrade(title: "Фаланга", description: "+4 автокл/с", baseCost: 450, autoClicksPerSecGain: 4.0),
                    Upgrade(title: "Акведуки", description: "+6 автокл/с", baseCost: 650, autoClicksPerSecGain: 6.0),
                    Upgrade(title: "Письменность", description: "+10 автокл/с", baseCost: 900, autoClicksPerSecGain: 10.0)
                ]
            ),
            Era(
                name: "Средневековье",
                emoji: "⚔️",
                color: .indigo,
                threshold: 1200,
                upgrades: [
                    Upgrade(title: "Цех ремесленников", description: "+15 автокл/с", baseCost: 1300, autoClicksPerSecGain: 15.0),
                    Upgrade(title: "Гильдии", description: "+25 автокл/с", baseCost: 2000, autoClicksPerSecGain: 25.0),
                    Upgrade(title: "Скриптории", description: "+40 автокл/с", baseCost: 3200, autoClicksPerSecGain: 40.0)
                ]
            ),
            Era(
                name: "Ренессанс",
                emoji: "🎨",
                color: .orange,
                threshold: 3000,
                upgrades: [
                    Upgrade(title: "Мастерские", description: "+60 автокл/с", baseCost: 3500, autoClicksPerSecGain: 60.0),
                    Upgrade(title: "Печатный станок", description: "+100 автокл/с", baseCost: 5200, autoClicksPerSecGain: 100.0),
                    Upgrade(title: "Навигация", description: "+160 автокл/с", baseCost: 8000, autoClicksPerSecGain: 160.0)
                ]
            ),
            Era(
                name: "Индустриальная эпоха",
                emoji: "🏭",
                color: .gray,
                threshold: 8000,
                upgrades: [
                    Upgrade(title: "Паровые машины", description: "+250 автокл/с", baseCost: 9000, autoClicksPerSecGain: 250.0),
                    Upgrade(title: "Конвейер", description: "+400 автокл/с", baseCost: 14000, autoClicksPerSecGain: 400.0),
                    Upgrade(title: "Электрификация", description: "+650 автокл/с", baseCost: 22000, autoClicksPerSecGain: 650.0)
                ]
            ),
            Era(
                name: "Модерн",
                emoji: "💡",
                color: .yellow,
                threshold: 20000,
                upgrades: [
                    Upgrade(title: "Массовое производство", description: "+900 автокл/с", baseCost: 24000, autoClicksPerSecGain: 900.0),
                    Upgrade(title: "Логистика", description: "+1400 автокл/с", baseCost: 36000, autoClicksPerSecGain: 1400.0),
                    Upgrade(title: "Авиация", description: "+2200 автокл/с", baseCost: 52000, autoClicksPerSecGain: 2200.0)
                ]
            ),
            Era(
                name: "Цифровая эра",
                emoji: "🧠",
                color: .purple,
                threshold: 60000,
                upgrades: [
                    Upgrade(title: "Вычислительные кластеры", description: "+4000 автокл/с", baseCost: 70000, autoClicksPerSecGain: 4000.0),
                    Upgrade(title: "Искусственный интеллект", description: "+6500 автокл/с", baseCost: 110000, autoClicksPerSecGain: 6500.0),
                    Upgrade(title: "Квантовые сети", description: "+10000 автокл/с", baseCost: 180000, autoClicksPerSecGain: 10000.0)
                ]
            )
        ]
    }
}

#Preview { ContentView() }
