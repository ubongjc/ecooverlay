import SwiftUI

@main
struct EcoOverlayApp: App {
    @StateObject private var authService = AuthService()
    @StateObject private var networkService = NetworkService()
    
    var body: some Scene {
        WindowGroup {
            if authService.isAuthenticated {
                MainTabView()
                    .environmentObject(authService)
                    .environmentObject(networkService)
            } else {
                SignInView()
                    .environmentObject(authService)
            }
        }
    }
}
