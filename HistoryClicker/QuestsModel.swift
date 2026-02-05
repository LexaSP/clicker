import Foundation

enum QuestType: String, Codable { case clicks, purchases, eraAdvance, offlineGain }

struct DailyQuest: Identifiable, Codable {
    let id: String
    let title: String
    let type: QuestType
    let target: Int
    var progress: Int
    let rewardClicks: Int
    let rewardSE: Int
    var completed: Bool
    var claimed: Bool
}

struct QuestsState: Codable {
    var dateKey: String // yyyy-MM-dd
    var quests: [DailyQuest]

    static func generate(for date: Date) -> QuestsState {
        let key = Self.key(for: date)
        let qs: [DailyQuest] = [
            DailyQuest(id: "q.clicks", title: "Сделай 500 кликов", type: .clicks, target: 500, progress: 0, rewardClicks: 250, rewardSE: 1, completed: false, claimed: false),
            DailyQuest(id: "q.buy", title: "Купи 5 апгрейдов", type: .purchases, target: 5, progress: 0, rewardClicks: 400, rewardSE: 1, completed: false, claimed: false),
            DailyQuest(id: "q.era", title: "Перейди эпоху", type: .eraAdvance, target: 1, progress: 0, rewardClicks: 600, rewardSE: 2, completed: false, claimed: false)
        ]
        return QuestsState(dateKey: key, quests: qs)
    }

    static func key(for date: Date) -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.locale = .init(identifier: "en_US_POSIX")
        return f.string(from: date)
    }
}
