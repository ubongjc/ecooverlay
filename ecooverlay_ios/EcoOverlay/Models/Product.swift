import Foundation

struct Product: Codable, Identifiable {
    let id: String
    let upc: String
    let name: String
    let brand: String?
    let category: String?
    let imageUrl: String?
    let description: String?
    let createdAt: Date
    let updatedAt: Date
    let footprints: [Footprint]?
    let alternatives: [AltSuggestion]?
}

struct Footprint: Codable, Identifiable {
    let id: String
    let productId: String
    let scope1: Double?
    let scope2: Double?
    let scope3: Double?
    let totalCo2e: Double
    let method: String
    let sources: [Source]
    let confidence: Double
    let uncertainty: Double?
    let verified: Bool
    let verifiedBy: String?
    let verifiedAt: Date?
    let createdAt: Date
    let updatedAt: Date
}

struct Source: Codable {
    let name: String
    let url: String?
    let date: String?
}

struct AltSuggestion: Codable, Identifiable {
    let id: String
    let productId: String
    let altProductId: String
    let carbonDelta: Double
    let reason: String
    let confidence: Double
    let altProduct: Product?
}

struct HealthResponse: Codable {
    let status: String
    let timestamp: String
    let services: Services
    
    struct Services: Codable {
        let database: String
        let api: String
    }
}
