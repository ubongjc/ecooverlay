import StoreKit
import Combine

@available(iOS 15.0, *)
class PurchaseService: ObservableObject {
    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []
    @Published var isLoading = false
    @Published var error: PurchaseError?
    
    private var updateListenerTask: Task<Void, Error>?
    
    enum PurchaseError: Error {
        case productNotFound
        case purchaseFailed
        case verificationFailed
        case networkError
    }
    
    static let premiumMonthly = "com.ecooverlay.premium.monthly"
    static let premiumYearly = "com.ecooverlay.premium.yearly"
    
    init() {
        updateListenerTask = listenForTransactions()
        
        Task {
            await loadProducts()
            await updatePurchasedProducts()
        }
    }
    
    deinit {
        updateListenerTask?.cancel()
    }
    
    func loadProducts() async {
        isLoading = true
        
        do {
            let productIDs = [
                Self.premiumMonthly,
                Self.premiumYearly,
            ]
            
            products = try await Product.products(for: productIDs)
            isLoading = false
        } catch {
            print("Failed to load products: \(error)")
            self.error = .networkError
            isLoading = false
        }
    }
    
    func purchase(_ product: Product) async throws {
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            
            await updatePurchasedProducts()
            await transaction.finish()
            
        case .userCancelled:
            break
            
        case .pending:
            break
            
        @unknown default:
            break
        }
    }
    
    func restorePurchases() async {
        do {
            try await AppStore.sync()
            await updatePurchasedProducts()
        } catch {
            print("Failed to restore purchases: \(error)")
            self.error = .verificationFailed
        }
    }
    
    func isPremiumActive() async -> Bool {
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else {
                continue
            }
            
            if transaction.productID == Self.premiumMonthly ||
               transaction.productID == Self.premiumYearly {
                return true
            }
        }
        
        return false
    }
    
    private func updatePurchasedProducts() async {
        var purchased: Set<String> = []
        
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else {
                continue
            }
            
            if transaction.revocationDate == nil {
                purchased.insert(transaction.productID)
            }
        }
        
        DispatchQueue.main.async {
            self.purchasedProductIDs = purchased
        }
    }
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw PurchaseError.verificationFailed
        case .verified(let safe):
            return safe
        }
    }
    
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else {
                    continue
                }
                
                await self.updatePurchasedProducts()
                await transaction.finish()
            }
        }
    }
}
