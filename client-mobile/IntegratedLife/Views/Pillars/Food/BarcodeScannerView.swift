import AVFoundation
import SwiftUI

struct BarcodeScannerView: View {
    @ObservedObject var foodState: FoodState
    @Environment(\.dismiss) private var dismiss

    @State private var scannedCode: String?
    @State private var selectedMealType: MealType = .lunch
    @State private var scannedEntry: FoodLogEntry?
    @State private var isScanning = true

    var body: some View {
        VStack(spacing: 0) {
            if isScanning {
                BarcodeCameraView(scannedCode: $scannedCode)
                    .ignoresSafeArea(edges: .top)
                    .overlay(alignment: .bottom) {
                        VStack(spacing: 12) {
                            Text("Point camera at a barcode")
                                .font(.subheadline)
                                .foregroundStyle(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(.black.opacity(0.6), in: Capsule())

                            Picker("Meal Type", selection: $selectedMealType) {
                                ForEach(MealType.allCases) { type in
                                    Text(type.displayName).tag(type)
                                }
                            }
                            .pickerStyle(.segmented)
                            .padding(.horizontal)
                            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
                            .padding(.horizontal)
                        }
                        .padding(.bottom, 20)
                    }
            }

            if foodState.isLoading {
                ProgressView("Looking up barcode...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            if let entry = scannedEntry {
                ScannedFoodResult(entry: entry) {
                    dismiss()
                }
            }
        }
        .navigationTitle("Scan Barcode")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: scannedCode) { _, code in
            guard let code, scannedEntry == nil else { return }
            isScanning = false
            Task {
                if let entry = await foodState.scanBarcode(code, mealType: selectedMealType) {
                    scannedEntry = entry
                }
            }
        }
    }
}

// MARK: - Scanned result

struct ScannedFoodResult: View {
    let entry: FoodLogEntry
    let onDismiss: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.largeTitle)
                .foregroundStyle(.green)

            Text(entry.food.name)
                .font(.title3.weight(.semibold))

            if let brand = entry.food.brand {
                Text(brand)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 16) {
                MacroColumn(label: "Calories", value: "\(Int(entry.food.nutrition.calories))", color: .orange)
                MacroColumn(label: "Protein", value: "\(Int(entry.food.nutrition.protein))g", color: .red)
                MacroColumn(label: "Carbs", value: "\(Int(entry.food.nutrition.carbs))g", color: .blue)
                MacroColumn(label: "Fat", value: "\(Int(entry.food.nutrition.fat))g", color: .yellow)
            }

            Text("Logged to \(entry.mealType.displayName)")
                .font(.caption)
                .foregroundStyle(.secondary)

            Button(action: onDismiss) {
                Text("Done")
                    .appActionLabelStyle()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Camera view using AVFoundation

struct BarcodeCameraView: UIViewControllerRepresentable {
    @Binding var scannedCode: String?

    func makeUIViewController(context: Context) -> BarcodeScannerViewController {
        let vc = BarcodeScannerViewController()
        vc.onCodeScanned = { code in
            DispatchQueue.main.async {
                if scannedCode == nil {
                    scannedCode = code
                }
            }
        }
        return vc
    }

    func updateUIViewController(_ uiViewController: BarcodeScannerViewController, context: Context) {}
}

final class BarcodeScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onCodeScanned: ((String) -> Void)?

    private let captureSession = AVCaptureSession()
    private var previewLayer: AVCaptureVideoPreviewLayer?

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCamera()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.bounds
    }

    private func setupCamera() {
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device),
              captureSession.canAddInput(input) else { return }

        captureSession.addInput(input)

        let output = AVCaptureMetadataOutput()
        guard captureSession.canAddOutput(output) else { return }
        captureSession.addOutput(output)

        output.setMetadataObjectsDelegate(self, queue: .main)
        output.metadataObjectTypes = [.ean8, .ean13, .upce, .code128, .code39]

        let layer = AVCaptureVideoPreviewLayer(session: captureSession)
        layer.videoGravity = .resizeAspectFill
        layer.frame = view.bounds
        view.layer.addSublayer(layer)
        previewLayer = layer

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession.startRunning()
        }
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let code = object.stringValue else { return }
        captureSession.stopRunning()
        onCodeScanned?(code)
    }
}
