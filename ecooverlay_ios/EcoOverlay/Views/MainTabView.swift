import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ScannerView()
                .tabItem {
                    Label("Scan", systemImage: "barcode.viewfinder")
                }
                .tag(0)
            
            HistoryView()
                .tabItem {
                    Label("History", systemImage: "clock.fill")
                }
                .tag(1)
            
            ImpactView()
                .tabItem {
                    Label("Impact", systemImage: "leaf.fill")
                }
                .tag(2)
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(3)
        }
    }
}

// MARK: - History View

struct HistoryView: View {
    var body: some View {
        NavigationView {
            List {
                Text("Your scan history will appear here")
                    .foregroundColor(.secondary)
            }
            .navigationTitle("History")
        }
    }
}

// MARK: - Impact View

struct ImpactView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Total Impact Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Your Carbon Impact")
                            .font(.headline)
                        
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("12.5")
                                .font(.system(size: 48, weight: .bold))
                            Text("kg CO₂")
                                .font(.title3)
                                .foregroundColor(.secondary)
                        }
                        
                        Text("saved this month")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(12)
                    
                    // Stats
                    VStack(spacing: 16) {
                        StatRow(
                            icon: "cart.fill",
                            label: "Products Scanned",
                            value: "24"
                        )
                        
                        StatRow(
                            icon: "arrow.triangle.swap",
                            label: "Better Choices Made",
                            value: "15"
                        )
                        
                        StatRow(
                            icon: "tree.fill",
                            label: "Trees Equivalent",
                            value: "0.6"
                        )
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Impact")
        }
    }
}

struct StatRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.green)
                .frame(width: 30)
            
            Text(label)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .fontWeight(.semibold)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}
