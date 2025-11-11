import SwiftUI
import AVFoundation

struct ScannerView: View {
    @EnvironmentObject var networkService: NetworkService
    @State private var scannedUPC: String?
    @State private var product: Product?
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showScanner = false
    
    var body: some View {
        NavigationView {
            ZStack {
                if let product = product {
                    ProductDetailView(product: product)
                } else {
                    VStack(spacing: 24) {
                        Spacer()
                        
                        Image(systemName: "barcode.viewfinder")
                            .resizable()
                            .frame(width: 120, height: 120)
                            .foregroundColor(.green)
                        
                        VStack(spacing: 8) {
                            Text("Scan a Product")
                                .font(.title2)
                                .fontWeight(.semibold)
                            
                            Text("Point your camera at a barcode to see its carbon footprint")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                        
                        Button(action: { showScanner = true }) {
                            HStack {
                                Image(systemName: "camera.fill")
                                Text("Start Scanning")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .padding(.horizontal, 32)
                        
                        Spacer()
                    }
                }
                
                if isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.2))
                }
            }
            .navigationTitle("EcoOverlay")
            .sheet(isPresented: $showScanner) {
                BarcodeScannerView { upc in
                    showScanner = false
                    loadProduct(upc: upc)
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private func loadProduct(upc: String) {
        isLoading = true
        scannedUPC = upc
        
        Task {
            do {
                let fetchedProduct = try await networkService.getProduct(upc: upc)
                await MainActor.run {
                    product = fetchedProduct
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Product not found. UPC: \(upc)"
                    showError = true
                    isLoading = false
                }
            }
        }
    }
}

// MARK: - Product Detail View

struct ProductDetailView: View {
    let product: Product
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Product Header
                VStack(alignment: .leading, spacing: 8) {
                    if let imageUrl = product.imageUrl {
                        AsyncImage(url: URL(string: imageUrl)) { image in
                            image.resizable()
                                .aspectRatio(contentMode: .fit)
                        } placeholder: {
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                        }
                        .frame(height: 200)
                        .cornerRadius(12)
                    }
                    
                    Text(product.name)
                        .font(.title)
                        .fontWeight(.bold)
                    
                    if let brand = product.brand {
                        Text(brand)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Carbon Footprint
                if let footprint = product.footprints?.first {
                    FootprintCard(footprint: footprint)
                }
                
                // Alternatives
                if let alternatives = product.alternatives, !alternatives.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Better Alternatives")
                            .font(.headline)
                        
                        ForEach(alternatives.prefix(3)) { alt in
                            AlternativeRow(suggestion: alt)
                        }
                    }
                }
            }
            .padding()
        }
    }
}

// MARK: - Footprint Card

struct FootprintCard: View {
    let footprint: Footprint
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "cloud.fill")
                    .foregroundColor(.green)
                Text("Carbon Footprint")
                    .font(.headline)
                Spacer()
                if footprint.verified {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundColor(.blue)
                }
            }
            
            Text("\(footprint.totalCo2e, specifier: "%.2f") kg CO₂e")
                .font(.title2)
                .fontWeight(.bold)
            
            if let scope1 = footprint.scope1,
               let scope2 = footprint.scope2,
               let scope3 = footprint.scope3 {
                VStack(alignment: .leading, spacing: 4) {
                    ScopeRow(label: "Scope 1 (Direct)", value: scope1)
                    ScopeRow(label: "Scope 2 (Energy)", value: scope2)
                    ScopeRow(label: "Scope 3 (Other)", value: scope3)
                }
                .font(.caption)
            }
            
            Text("Confidence: \(Int(footprint.confidence * 100))%")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ScopeRow: View {
    let label: String
    let value: Double
    
    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Text("\(value, specifier: "%.2f") kg")
        }
    }
}

// MARK: - Alternative Row

struct AlternativeRow: View {
    let suggestion: AltSuggestion
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                if let altProduct = suggestion.altProduct {
                    Text(altProduct.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    if let brand = altProduct.brand {
                        Text(brand)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Text(suggestion.reason)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Text("\(abs(suggestion.carbonDelta), specifier: "%.2f") kg")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.green)
                
                Text("less CO₂")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

// MARK: - Barcode Scanner View (Placeholder)

struct BarcodeScannerView: View {
    let onScan: (String) -> Void
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack {
            Text("Camera Barcode Scanner")
                .font(.title2)
                .padding()
            
            Text("Camera access requires AVFoundation setup")
                .font(.caption)
                .foregroundColor(.secondary)
            
            Spacer()
            
            // For demo purposes, allow manual entry
            Button("Use Demo UPC: 012345678905") {
                onScan("012345678905")
            }
            .padding()
            
            Button("Cancel") {
                dismiss()
            }
            .padding()
        }
    }
}
