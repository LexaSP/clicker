import SwiftUI

struct PrestigeTreeView: View {
    @Binding var state: PrestigeState
    var onSave: () -> Void

    var body: some View {
        NavigationStack {
            List {
                Section(header: Text("Валюта")) {
                    HStack {
                        Label("Символы Эпох", systemImage: "seal.fill")
                        Spacer()
                        Text("\(state.symbolsOfEra)")
                            .font(.headline.monospaced())
                    }
                }

                Section(header: Text("Дерево перков")) {
                    ForEach(state.perks.indices, id: \.self) { i in
                        let perk = state.perks[i]
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(perk.title).font(.headline)
                                Text(perk.description).font(.caption).foregroundStyle(.secondary)
                                Text("Уровень: \(perk.level)")
                                    .font(.caption2.monospaced())
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            VStack(alignment: .trailing) {
                                Button {
                                    buy(perkAt: i)
                                } label: {
                                    Text("Купить за \(perk.currentCost)")
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(state.symbolsOfEra >= perk.currentCost ? .purple : .gray)
                                .disabled(state.symbolsOfEra < perk.currentCost)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                }
            }
            .navigationTitle("Наследие")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Text("SE: \(state.symbolsOfEra)").font(.subheadline.monospaced()).foregroundStyle(.purple)
                }
            }
        }
    }

    private func buy(perkAt index: Int) {
        guard state.perks.indices.contains(index) else { return }
        let cost = state.perks[index].currentCost
        guard state.symbolsOfEra >= cost else { return }
        state.symbolsOfEra -= cost
        state.perks[index].level += 1
        onSave()
    }
}

#Preview {
    @Previewable @State var s = PrestigeState()
    return PrestigeTreeView(state: $s) {}
}
