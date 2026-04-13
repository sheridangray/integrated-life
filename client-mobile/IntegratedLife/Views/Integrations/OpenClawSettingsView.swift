import SwiftUI

struct OpenClawSettingsView: View {
    @AppStorage("openclaw.instacartPrompt") private var savedPrompt = Self.defaultPrompt
    @State private var editingPrompt = ""
    @State private var isEditing = false
    @FocusState private var isFocused: Bool

    var body: some View {
        List {
            Section {
                HStack(spacing: 12) {
                    Image(systemName: "cart.fill")
                        .font(.title2)
                        .foregroundStyle(.orange)
                        .frame(width: 36, height: 36)
                        .background(.orange.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Instacart Shopping")
                            .font(.body)
                        Text("Via OpenClaw agent")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 2)
            } footer: {
                Text("When you tap \"Send to Instacart\" on your grocery list, this prompt is sent to OpenClaw along with your items. OpenClaw will handle the Instacart order and message you on Slack.")
            }

            Section("Shopping Instructions") {
                if isEditing {
                    TextEditor(text: $editingPrompt)
                        .font(.body.monospaced())
                        .frame(minHeight: 300)
                        .focused($isFocused)
                } else {
                    Text(savedPrompt)
                        .font(.body.monospaced())
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("OpenClaw")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                if isEditing {
                    Button("Save") {
                        savedPrompt = editingPrompt
                        isEditing = false
                        isFocused = false
                    }
                } else {
                    Button("Edit") {
                        editingPrompt = savedPrompt
                        isEditing = true
                        isFocused = true
                    }
                }
            }

            if isEditing {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        isEditing = false
                        isFocused = false
                    }
                }
            }

            if isEditing {
                ToolbarItem(placement: .bottomBar) {
                    Button("Reset to Default") {
                        editingPrompt = Self.defaultPrompt
                    }
                    .font(.subheadline)
                }
            }
        }
    }

    static let defaultPrompt = """
STORE RULES:
- Costco: Meat, vegetables, and fruit ONLY. Bulk is fine.
- Safeway: Everything else — dairy, pantry, herbs, condiments, sauces, wine, dry goods, frozen.
- If an item isn't available at the assigned store, flag it — don't auto-substitute.

PANTRY STAPLES (already have — exclude):
Kosher salt, black pepper, olive oil, neutral oil, butter, garlic, soy sauce, fish sauce, jasmine rice, common dried spices.

INSTRUCTIONS:
1. Log into instacart.com (credentials in ~/.openclaw/secrets/instacart.txt).
2. Search and add items. Prefer store brand unless quality matters (e.g., meat). Closest size to what's needed, in-stock.
3. If price difference between options is >30%, message me on Slack for a decision.
4. If an item is out of stock, suggest a substitute on Slack and wait for my reply before adding.
5. After all items are added, send me a Slack summary: total items per store, estimated total per store, any flags.
6. Wait to checkout until I give confirmation.

PREFERENCES:
- Organic produce when <25% price premium
- Bone-in, skin-on poultry
- Cheapest brand for pantry items
- Exact quantities — don't overbuy unless only option is larger size
"""
}
