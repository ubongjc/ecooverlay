import AVFoundation
import UIKit
import Vision
import Combine

class BarcodeScannerService: NSObject, ObservableObject {
    @Published var scannedCode: String?
    @Published var isScanning = false
    @Published var error: ScannerError?
    
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private let sequenceHandler = VNSequenceRequestHandler()
    
    enum ScannerError: Error {
        case cameraPermissionDenied
        case cameraNotAvailable
        case setupFailed
        case scanningFailed
    }
    
    // MARK: - Camera Setup
    
    func setupCamera() async throws -> AVCaptureVideoPreviewLayer {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            break
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            if !granted {
                throw ScannerError.cameraPermissionDenied
            }
        case .denied, .restricted:
            throw ScannerError.cameraPermissionDenied
        @unknown default:
            throw ScannerError.cameraPermissionDenied
        }
        
        let session = AVCaptureSession()
        session.beginConfiguration()
        
        guard let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            throw ScannerError.cameraNotAvailable
        }
        
        let videoInput = try AVCaptureDeviceInput(device: videoDevice)
        guard session.canAddInput(videoInput) else {
            throw ScannerError.setupFailed
        }
        session.addInput(videoInput)
        
        let videoOutput = AVCaptureVideoDataOutput()
        videoOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "VideoQueue"))
        guard session.canAddOutput(videoOutput) else {
            throw ScannerError.setupFailed
        }
        session.addOutput(videoOutput)
        
        session.commitConfiguration()
        
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.videoGravity = .resizeAspectFill
        
        self.captureSession = session
        self.previewLayer = previewLayer
        
        return previewLayer
    }
    
    func startScanning() {
        guard let session = captureSession else { return }
        
        if !session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async {
                session.startRunning()
                DispatchQueue.main.async {
                    self.isScanning = true
                }
            }
        }
    }
    
    func stopScanning() {
        guard let session = captureSession else { return }
        
        if session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async {
                session.stopRunning()
                DispatchQueue.main.async {
                    self.isScanning = false
                }
            }
        }
    }
    
    func toggleTorch() {
        guard let device = AVCaptureDevice.default(for: .video) else { return }
        
        if device.hasTorch {
            try? device.lockForConfiguration()
            device.torchMode = device.torchMode == .on ? .off : .on
            device.unlockForConfiguration()
        }
    }
    
    func cleanup() {
        stopScanning()
        captureSession = nil
        previewLayer = nil
    }
}

extension BarcodeScannerService: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(
        _ output: AVCaptureOutput,
        didOutput sampleBuffer: CMSampleBuffer,
        from connection: AVCaptureConnection
    ) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            return
        }
        
        let request = VNDetectBarcodesRequest { [weak self] request, error in
            if let error = error {
                DispatchQueue.main.async {
                    self?.error = .scanningFailed
                }
                return
            }
            
            guard let results = request.results as? [VNBarcodeObservation],
                  let firstBarcode = results.first,
                  let payload = firstBarcode.payloadStringValue else {
                return
            }
            
            let supportedTypes: [VNBarcodeSymbology] = [
                .upce,
                .ean8,
                .ean13,
                .code128,
            ]
            
            guard supportedTypes.contains(firstBarcode.symbology) else {
                return
            }
            
            DispatchQueue.main.async {
                self?.scannedCode = payload
                self?.stopScanning()
                
                let generator = UINotificationFeedbackGenerator()
                generator.notificationOccurred(.success)
            }
        }
        
        request.revision = VNDetectBarcodesRequestRevision1
        
        try? sequenceHandler.perform([request], on: pixelBuffer)
    }
}
