# EcoOverlay iOS

Native iOS application for EcoOverlay - scan products and see their carbon footprint with AR overlay.

## Tech Stack

- **Framework**: SwiftUI
- **Language**: Swift 5.9+
- **Architecture**: MVVM with Combine
- **Networking**: URLSession with async/await
- **Security**: CryptoKit (AES-GCM encryption)
- **Auth**: AuthenticationServices (Passkeys)
- **Camera**: AVFoundation + Vision
- **Payments**: StoreKit 2

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+

## Project Structure

```
EcoOverlay/
├── EcoOverlayApp.swift          # App entry point
├── Models/                      # Data models
│   └── Product.swift
├── Views/                       # SwiftUI views
│   ├── SignInView.swift
│   ├── ScannerView.swift
│   ├── SettingsView.swift
│   └── MainTabView.swift
├── ViewModels/                  # View models
├── Services/                    # Business logic
│   ├── Networking/
│   │   └── NetworkService.swift
│   ├── Crypto/
│   │   └── CryptoService.swift
│   └── Auth/
│       └── AuthService.swift
├── Resources/                   # Assets, localization
└── Utils/                       # Helpers
```

## Features

### Core Features

- **Barcode Scanning**: Scan product barcodes using device camera
- **Carbon Footprint Display**: View detailed CO₂ emissions data
- **Alternative Suggestions**: See lower-carbon alternatives
- **Impact Tracking**: Track your carbon savings over time

### Security & Privacy

- **Passkey Authentication**: Secure, passwordless authentication using platform biometrics
- **Client-Side Encryption**: All sensitive data encrypted with AES-GCM before upload
- **Keychain Integration**: Secure storage of encryption keys
- **End-to-End Encryption**: Server only stores ciphertext

### Premium Features

- Advanced analytics
- Priority support
- Early access to new features

## Setup

1. Open the project in Xcode:
```bash
open EcoOverlay.xcodeproj
```

2. Configure the API endpoint in `NetworkService.swift`:
```swift
init(baseURL: String = "https://api.ecooverlay.app")
```

3. Add required capabilities in Xcode:
   - Camera usage
   - Passkeys
   - StoreKit

4. Build and run on device or simulator

## Architecture

### Networking Layer

The `NetworkService` class provides a type-safe API client with:
- Generic request handling
- Automatic JSON encoding/decoding
- Error handling
- Bearer token authentication

### Encryption Layer

The `CryptoService` class provides:
- AES-GCM encryption/decryption
- Secure key generation and storage
- Keychain integration

### Authentication

The `AuthService` class handles:
- Passkey creation and assertion
- Token management
- User session state

## API Integration

The app communicates with the Next.js backend via REST API:

- Base URL: `http://localhost:3000` (development)
- Authentication: Bearer token
- Content-Type: `application/json`

See the web app's OpenAPI documentation for full API details.

## Testing

Run tests in Xcode:
```
Cmd + U
```

## Distribution

For App Store distribution:
1. Update version in Info.plist
2. Archive the app
3. Upload to App Store Connect
4. Submit for review

## Privacy Compliance

- Camera usage description required
- Biometric usage description required
- Data export available via Settings
- Account deletion available via Settings

## License

Proprietary - All Rights Reserved
