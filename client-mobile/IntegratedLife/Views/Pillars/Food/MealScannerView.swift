import PhotosUI
import SwiftUI

struct MealScannerView: View {
    @ObservedObject var foodState: FoodState
    @Environment(\.dismiss) private var dismiss

    @State private var selectedPhoto: PhotosPickerItem?
    @State private var capturedImage: UIImage?
    @State private var selectedMealType: MealType = .lunch
    @State private var scannedEntry: FoodLogEntry?
    @State private var showCamera = false
    @State private var showPhotoPicker = false

    var body: some View {
        VStack(spacing: 20) {
            if foodState.isLoading {
                ProgressView("Analyzing meal photo...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let entry = scannedEntry {
                ScannedFoodResult(entry: entry) {
                    dismiss()
                }
            } else {
                Spacer()

                // Preview
                if let image = capturedImage {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 300)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal)
                } else {
                    Image(systemName: "camera.viewfinder")
                        .font(.system(size: 80))
                        .foregroundStyle(.secondary)
                    Text("Take a photo of your meal")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                // Meal type picker
                Picker("Meal Type", selection: $selectedMealType) {
                    ForEach(MealType.allCases) { type in
                        Text(type.displayName).tag(type)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                // Capture buttons
                HStack(spacing: 16) {
                    Button {
                        showCamera = true
                    } label: {
                        Label("Camera", systemImage: "camera")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)

                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        Label("Photos", systemImage: "photo.on.rectangle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
                .padding(.horizontal)

                // Analyze button
                if capturedImage != nil {
                    Button {
                        Task { await analyzePhoto() }
                    } label: {
                        Text("Analyze Meal")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .padding(.horizontal)
                }

                Spacer()
            }
        }
        .navigationTitle("Scan Meal")
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(isPresented: $showCamera) {
            CameraView(image: $capturedImage)
        }
        .onChange(of: selectedPhoto) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    capturedImage = image
                }
            }
        }
    }

    private func analyzePhoto() async {
        guard let image = capturedImage,
              let data = image.jpegData(compressionQuality: 0.8) else { return }
        scannedEntry = await foodState.scanMealPhoto(imageData: data, mealType: selectedMealType)
    }
}

// MARK: - Camera UIKit wrapper

struct CameraView: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraView

        init(_ parent: CameraView) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let uiImage = info[.originalImage] as? UIImage {
                parent.image = uiImage
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}
