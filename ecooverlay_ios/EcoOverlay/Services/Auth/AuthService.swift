import Foundation
import AuthenticationServices
import Combine

class AuthService: NSObject, ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private let keychain = KeychainService()
    private var networkService: NetworkService?
    
    override init() {
        super.init()
        checkAuthStatus()
    }
    
    func setNetworkService(_ service: NetworkService) {
        self.networkService = service
    }
    
    private func checkAuthStatus() {
        // Check if we have a stored auth token
        if let tokenData = try? keychain.get(key: "auth_token"),
           let token = String(data: tokenData, encoding: .utf8) {
            isAuthenticated = true
            networkService?.setAuthToken(token)
        }
    }
    
    // MARK: - Passkey Authentication
    
    func signInWithPasskey() async throws {
        let challenge = Data(UUID().uuidString.utf8)
        let userID = Data(UUID().uuidString.utf8)
        
        let platformProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(
            relyingPartyIdentifier: "ecooverlay.app"
        )
        
        let assertionRequest = platformProvider.createCredentialAssertionRequest(challenge: challenge)
        
        let authController = ASAuthorizationController(authorizationRequests: [assertionRequest])
        authController.delegate = self
        authController.performRequests()
    }
    
    func signUp(email: String) async throws {
        // This would typically integrate with Clerk's API
        // For now, we'll simulate the flow
        let challenge = Data(UUID().uuidString.utf8)
        let userID = Data(email.utf8)
        
        let platformProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(
            relyingPartyIdentifier: "ecooverlay.app"
        )
        
        let registrationRequest = platformProvider.createCredentialRegistrationRequest(
            challenge: challenge,
            name: email,
            userID: userID
        )
        
        let authController = ASAuthorizationController(authorizationRequests: [registrationRequest])
        authController.delegate = self
        authController.performRequests()
    }
    
    func signOut() {
        keychain.delete(key: "auth_token")
        networkService?.clearAuthToken()
        isAuthenticated = false
        currentUser = nil
    }
}

// MARK: - ASAuthorizationControllerDelegate

extension AuthService: ASAuthorizationControllerDelegate {
    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion {
            // Handle assertion (sign in)
            handlePasskeyAssertion(credential)
        } else if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration {
            // Handle registration (sign up)
            handlePasskeyRegistration(credential)
        }
    }
    
    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        print("Passkey authentication failed: \(error.localizedDescription)")
    }
    
    private func handlePasskeyAssertion(_ credential: ASAuthorizationPlatformPublicKeyCredentialAssertion) {
        // Verify with backend and get auth token
        // For now, simulate successful auth
        let mockToken = "mock-jwt-token"
        
        if let tokenData = mockToken.data(using: .utf8) {
            try? keychain.save(key: "auth_token", data: tokenData)
            networkService?.setAuthToken(mockToken)
            
            DispatchQueue.main.async {
                self.isAuthenticated = true
            }
        }
    }
    
    private func handlePasskeyRegistration(_ credential: ASAuthorizationPlatformPublicKeyCredentialRegistration) {
        // Register with backend and get auth token
        // For now, simulate successful registration
        let mockToken = "mock-jwt-token"
        
        if let tokenData = mockToken.data(using: .utf8) {
            try? keychain.save(key: "auth_token", data: tokenData)
            networkService?.setAuthToken(mockToken)
            
            DispatchQueue.main.async {
                self.isAuthenticated = true
            }
        }
    }
}

struct User: Codable {
    let id: String
    let email: String
    let name: String?
}
