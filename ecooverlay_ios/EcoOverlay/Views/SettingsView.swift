import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showDeleteConfirmation = false
    @State private var exportingData = false
    
    var body: some View {
        NavigationView {
            List {
                // Account Section
                Section("Account") {
                    if let user = authService.currentUser {
                        HStack {
                            Text("Email")
                            Spacer()
                            Text(user.email)
                                .foregroundColor(.secondary)
                        }
                        
                        if let name = user.name {
                            HStack {
                                Text("Name")
                                Spacer()
                                Text(name)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                    NavigationLink("Subscription") {
                        SubscriptionView()
                    }
                }
                
                // Privacy Section
                Section("Privacy & Data") {
                    Button(action: exportData) {
                        HStack {
                            Image(systemName: "arrow.down.doc")
                            Text("Export My Data")
                            if exportingData {
                                Spacer()
                                ProgressView()
                            }
                        }
                    }
                    .disabled(exportingData)
                    
                    NavigationLink("Privacy Policy") {
                        PrivacyPolicyView()
                    }
                    
                    Button(role: .destructive, action: { showDeleteConfirmation = true }) {
                        HStack {
                            Image(systemName: "trash")
                            Text("Delete Account & Data")
                        }
                    }
                }
                
                // App Info
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    
                    Link(destination: URL(string: "https://ecooverlay.app/terms")!) {
                        HStack {
                            Text("Terms of Service")
                            Spacer()
                            Image(systemName: "arrow.up.right")
                                .font(.caption)
                        }
                    }
                }
                
                // Sign Out
                Section {
                    Button(role: .destructive, action: signOut) {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .alert("Delete Account", isPresented: $showDeleteConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive, action: deleteAccount) {}
            } message: {
                Text("This will permanently delete your account and all associated data. This action cannot be undone.")
            }
        }
    }
    
    private func exportData() {
        exportingData = true
        
        Task {
            // Simulate data export (would actually call API)
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            
            await MainActor.run {
                exportingData = false
                // Show share sheet with exported data
            }
        }
    }
    
    private func deleteAccount() {
        Task {
            // Would call API to delete account
            await MainActor.run {
                authService.signOut()
            }
        }
    }
    
    private func signOut() {
        authService.signOut()
    }
}

// MARK: - Subscription View

struct SubscriptionView: View {
    @State private var currentPlan = "Free"
    
    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Current Plan")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(currentPlan)
                        .font(.title2)
                        .fontWeight(.semibold)
                }
            }
            
            Section("Premium Features") {
                FeatureRow(
                    icon: "chart.bar.fill",
                    title: "Advanced Analytics",
                    description: "Track your carbon savings over time"
                )
                
                FeatureRow(
                    icon: "star.fill",
                    title: "Priority Support",
                    description: "Get help from our team faster"
                )
                
                FeatureRow(
                    icon: "sparkles",
                    title: "Early Access",
                    description: "Try new features before everyone else"
                )
            }
            
            Section {
                Button(action: upgradeToPremium) {
                    HStack {
                        Spacer()
                        Text("Upgrade to Premium")
                            .fontWeight(.semibold)
                        Spacer()
                    }
                }
            }
        }
        .navigationTitle("Subscription")
    }
    
    private func upgradeToPremium() {
        // Would integrate with StoreKit
        print("Upgrade to premium")
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.green)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Privacy Policy View

struct PrivacyPolicyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Privacy Policy")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Your privacy is important to us. EcoOverlay uses end-to-end encryption to protect your data.")
                    .font(.body)
                
                Text("Data Collection")
                    .font(.headline)
                    .padding(.top)
                
                Text("We collect minimal data necessary to provide our services, including product scans and preferences.")
                    .font(.body)
                
                Text("Data Storage")
                    .font(.headline)
                    .padding(.top)
                
                Text("All sensitive data is encrypted on your device before being sent to our servers. We never have access to your unencrypted personal information.")
                    .font(.body)
                
                Text("Your Rights")
                    .font(.headline)
                    .padding(.top)
                
                Text("You have the right to export or delete your data at any time from the Settings screen.")
                    .font(.body)
            }
            .padding()
        }
        .navigationTitle("Privacy Policy")
    }
}
