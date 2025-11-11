import Foundation
import Combine

enum NetworkError: Error {
    case invalidURL
    case requestFailed
    case decodingFailed
    case unauthorized
    case serverError(String)
}

class NetworkService: ObservableObject {
    private let baseURL: String
    private let session: URLSession
    private var authToken: String?
    
    init(baseURL: String = "http://localhost:3000") {
        self.baseURL = baseURL
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config)
    }
    
    func setAuthToken(_ token: String) {
        self.authToken = token
    }
    
    func clearAuthToken() {
        self.authToken = nil
    }
    
    // MARK: - Generic Request
    
    func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.requestFailed
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            
            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                print("Decoding error: \(error)")
                throw NetworkError.decodingFailed
            }
            
        case 401:
            throw NetworkError.unauthorized
            
        default:
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw NetworkError.serverError(errorMessage)
        }
    }
    
    // MARK: - API Methods
    
    func healthCheck() async throws -> HealthResponse {
        return try await request(endpoint: "/api/health")
    }
    
    func getProduct(upc: String) async throws -> Product {
        // URL encode the UPC to handle special characters
        guard let encodedUPC = upc.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) else {
            throw NetworkError.invalidURL
        }
        return try await request(endpoint: "/api/product/\(encodedUPC)")
    }

    func createProduct(upc: String, name: String, brand: String?, category: String?) async throws -> Product {
        // URL encode the UPC to handle special characters
        guard let encodedUPC = upc.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) else {
            throw NetworkError.invalidURL
        }

        // Build payload only with non-nil values
        var payload: [String: String] = ["name": name]

        if let brand = brand {
            payload["brand"] = brand
        }

        if let category = category {
            payload["category"] = category
        }

        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        let body = try encoder.encode(payload)

        return try await request(endpoint: "/api/product/\(encodedUPC)", method: "POST", body: body)
    }

    func getFootprints(productId: String) async throws -> [Footprint] {
        // URL encode the productId to handle special characters
        guard let encodedId = productId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) else {
            throw NetworkError.invalidURL
        }
        return try await request(endpoint: "/api/footprint/\(encodedId)")
    }

    func getAlternatives(productId: String) async throws -> [AltSuggestion] {
        // URL encode the productId to handle special characters
        guard let encodedId = productId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) else {
            throw NetworkError.invalidURL
        }
        return try await request(endpoint: "/api/alternates/\(encodedId)")
    }
}
