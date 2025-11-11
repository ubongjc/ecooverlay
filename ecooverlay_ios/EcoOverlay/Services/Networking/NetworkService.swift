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
        return try await request(endpoint: "/api/product/\(upc)")
    }
    
    func createProduct(upc: String, name: String, brand: String?, category: String?) async throws -> Product {
        let payload = [
            "name": name,
            "brand": brand ?? "",
            "category": category ?? ""
        ]
        
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        let body = try encoder.encode(payload)
        
        return try await request(endpoint: "/api/product/\(upc)", method: "POST", body: body)
    }
    
    func getFootprints(productId: String) async throws -> [Footprint] {
        return try await request(endpoint: "/api/footprint/\(productId)")
    }
    
    func getAlternatives(productId: String) async throws -> [AltSuggestion] {
        return try await request(endpoint: "/api/alternates/\(productId)")
    }
}
