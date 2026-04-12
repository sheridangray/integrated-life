import SwiftUI

struct AIRecipeCreationSheet: View {
    @ObservedObject var foodState: FoodState
    @Environment(\.dismiss) private var dismiss
    @State private var prompt = ""
    @State private var generatedRecipeId: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("e.g. Pepperoni Pizza, Thai Green Curry", text: $prompt, axis: .vertical)
                        .lineLimit(2...4)
                        .disabled(foodState.aiRecipeGenerating)
                } header: {
                    Text("What would you like to make?")
                }

                if foodState.aiRecipeGenerating {
                    Section {
                        HStack(spacing: 12) {
                            ProgressView()
                            Text("Generating recipe & images...")
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                if let err = foodState.error, !foodState.aiRecipeGenerating {
                    Section {
                        Text(err)
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Create with AI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .disabled(foodState.aiRecipeGenerating)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Generate") {
                        Task { await generate() }
                    }
                    .disabled(prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || foodState.aiRecipeGenerating)
                }
            }
        }
    }

    private func generate() async {
        let trimmed = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if let recipe = await foodState.createRecipeFromAI(prompt: trimmed) {
            generatedRecipeId = recipe.id
            dismiss()
        }
    }
}

struct AIRecipeEditSheet: View {
    let recipeId: String
    @ObservedObject var foodState: FoodState
    @Environment(\.dismiss) private var dismiss
    @State private var prompt = ""
    @State private var action: EditAction = .variant

    enum EditAction: String, CaseIterable {
        case overwrite = "overwrite"
        case variant = "variant"

        var label: String {
            switch self {
            case .overwrite: return "Overwrite"
            case .variant: return "New Variant"
            }
        }

        var description: String {
            switch self {
            case .overwrite: return "Replace the current recipe"
            case .variant: return "Create a new version alongside the original"
            }
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("e.g. make it vegetarian, add pepperoni", text: $prompt, axis: .vertical)
                        .lineLimit(2...4)
                        .disabled(foodState.aiRecipeGenerating)
                } header: {
                    Text("How would you like to change this recipe?")
                }

                Section {
                    Picker("Save as", selection: $action) {
                        ForEach(EditAction.allCases, id: \.self) { a in
                            VStack(alignment: .leading) {
                                Text(a.label)
                            }
                            .tag(a)
                        }
                    }
                    .pickerStyle(.segmented)

                    Text(action.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if foodState.aiRecipeGenerating {
                    Section {
                        HStack(spacing: 12) {
                            ProgressView()
                            Text("Applying changes...")
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                if let err = foodState.error, !foodState.aiRecipeGenerating {
                    Section {
                        Text(err)
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Edit with AI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .disabled(foodState.aiRecipeGenerating)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Apply") {
                        Task { await applyEdit() }
                    }
                    .disabled(prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || foodState.aiRecipeGenerating)
                }
            }
        }
    }

    private func applyEdit() async {
        let trimmed = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if let _ = await foodState.editRecipeWithAI(id: recipeId, prompt: trimmed, action: action.rawValue) {
            dismiss()
        }
    }
}
