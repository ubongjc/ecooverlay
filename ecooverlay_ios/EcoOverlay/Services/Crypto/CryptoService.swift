import Foundation
import CryptoKit

enum CryptoError: Error {
    case encryptionFailed
    case decryptionFailed
    case invalidKey
    case invalidData
}

class CryptoService {
    private let keychain = KeychainService()
    
    // MARK: - Key Management
    
    func getOrCreateEncryptionKey() throws -> SymmetricKey {
        // Try to get existing key from keychain
        if let keyData = try? keychain.get(key: "encryption_key") {
            return SymmetricKey(data: keyData)
        }
        
        // Create new key
        let key = SymmetricKey(size: .bits256)
        let keyData = key.withUnsafeBytes { Data($0) }
        try keychain.save(key: "encryption_key", data: keyData)
        
        return key
    }
    
    // MARK: - AES-GCM Encryption/Decryption
    
    func encrypt(data: Data) throws -> Data {
        let key = try getOrCreateEncryptionKey()
        
        guard let sealedBox = try? AES.GCM.seal(data, using: key) else {
            throw CryptoError.encryptionFailed
        }
        
        // Combined format: nonce + ciphertext + tag
        guard let combined = sealedBox.combined else {
            throw CryptoError.encryptionFailed
        }
        
        return combined
    }
    
    func decrypt(data: Data) throws -> Data {
        let key = try getOrCreateEncryptionKey()
        
        guard let sealedBox = try? AES.GCM.SealedBox(combined: data) else {
            throw CryptoError.invalidData
        }
        
        guard let decrypted = try? AES.GCM.open(sealedBox, using: key) else {
            throw CryptoError.decryptionFailed
        }
        
        return decrypted
    }
    
    // MARK: - String Helpers
    
    func encryptString(_ string: String) throws -> String {
        guard let data = string.data(using: .utf8) else {
            throw CryptoError.invalidData
        }
        
        let encrypted = try encrypt(data: data)
        return encrypted.base64EncodedString()
    }
    
    func decryptString(_ base64String: String) throws -> String {
        guard let data = Data(base64Encoded: base64String) else {
            throw CryptoError.invalidData
        }
        
        let decrypted = try decrypt(data: data)
        
        guard let string = String(data: decrypted, encoding: .utf8) else {
            throw CryptoError.invalidData
        }
        
        return string
    }
}

// MARK: - Keychain Service

class KeychainService {
    func save(key: String, data: Data) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        SecItemDelete(query as CFDictionary)
        
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw CryptoError.invalidKey
        }
    }
    
    func get(key: String) throws -> Data {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data else {
            throw CryptoError.invalidKey
        }
        
        return data
    }
    
    func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}
