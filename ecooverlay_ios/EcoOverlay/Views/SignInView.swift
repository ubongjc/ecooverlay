import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @EnvironmentObject var authService: AuthService
    @State private var email = ""
    @State private var isSigningIn = false
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            // Logo and Title
            VStack(spacing: 12) {
                Image(systemName: "leaf.circle.fill")
                    .resizable()
                    .frame(width: 80, height: 80)
                    .foregroundColor(.green)
                
                Text("EcoOverlay")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Scan. Compare. Choose Better.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Sign in with Passkey
            VStack(spacing: 16) {
                Button(action: signInWithPasskey) {
                    HStack {
                        Image(systemName: "faceid")
                        Text("Sign in with Passkey")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isSigningIn)
                
                Text("or")
                    .foregroundColor(.secondary)
                
                // Email input for new users
                VStack(alignment: .leading, spacing: 8) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    
                    Button(action: signUpWithEmail) {
                        Text("Create Account with Passkey")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .disabled(email.isEmpty || isSigningIn)
                }
            }
            .padding(.horizontal, 32)
            
            Spacer()
            
            // Privacy note
            Text("Your data is encrypted end-to-end")
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.bottom, 32)
        }
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }
    
    private func signInWithPasskey() {
        isSigningIn = true
        
        Task {
            do {
                try await authService.signInWithPasskey()
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
            
            await MainActor.run {
                isSigningIn = false
            }
        }
    }
    
    private func signUpWithEmail() {
        isSigningIn = true
        
        Task {
            do {
                try await authService.signUp(email: email)
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
            
            await MainActor.run {
                isSigningIn = false
            }
        }
    }
}
