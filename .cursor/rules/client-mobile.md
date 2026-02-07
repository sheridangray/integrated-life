You are an expert iOS developer using Swift and SwiftUI. Follow these guidelines:

# Code Structure

- Use Swift's latest features and protocol-oriented programming
- Prefer value types (structs) over classes
- Use feature-scoped MVVM with SwiftUI, separating: rendering (Views), state & async logic (ViewModels), side effects (Services), and navigation (Coordinators/Routers)
- Structure: Features/, Core/, UI/, Resources/
- Follow Apple's Human Interface Guidelines


# Naming
- camelCase for vars/funcs, PascalCase for types
- Verbs for methods (fetchData)
- Boolean: use is/has/should prefixes
- Clear, descriptive names following Apple style

# Swift Best Practices

- Strong type system, proper optionals
- Use async/await for most flows; only use Combine for reactive streams (e.g. notifications, publishers, bridging)
- Prefer throws + typed errors; use Result only when required.
- @Published, @StateObject for state
- Prefer let over var
- Protocol extensions for shared code
- Use SwiftLint/SwiftFormat

# UI Development

- SwiftUI first, UIKit when needed
- SF Symbols for icons
- Support dark mode, dynamic type
- Handle all screen sizes and orientations
- Implement proper keyboard handling
- Build with accessibilitly in mind (e.g. use labels/hints, hit targets, reduce motion, VoiceOver order)

# Performance

- Profile with Instruments
- Lazy load views and images
- Optimize network requests
- Background task handling
- Proper state management
- Memory management

# Data & State

- Use SwiftData for offline-first persistence, with: versioned models and planned migrations, clear ownership of local vs server-backed data, explicit conflict-resolution rules when syncing, and all persistence accessed through services (not Views).
- UserDefaults for preferences
- Clean data flow architecture
- Proper dependency injection
- Handle state restoration
- UI updates on main actor; prefer immutable view state; model loading state machine.

# Security

- This app follows Apple-recommended security defaults. Avoid custom cryptography or advanced security mechanisms unless a clear need is identified.

## Data Storage Rules

- Use Keychain for sensitive data only, including authentication tokens, refresh tokens, and API keys or secrets
- Do not store sensitive data in SwiftData or UserDefaults
- SwiftData is for app data and cached server data only
- UserDefaults is for non-sensitive preferences only (e.g. theme, onboarding flags, feature toggles)
## Networking & Transport Security
- Use HTTPS for all network requests
- Rely on App Transport Security (ATS) defaults
- Do not weaken ATS unless a backend explicitly requires it
- Do not implement certificate pinning by default
- Only add certificate pinning if there is a documented high-risk threat model
- Certificate pinning requires an explicit rotation and recovery plan
## Authentication & Tokens
- Treat access tokens as short-lived
- Store all tokens only in Keychain
- Never log tokens, secrets, or personally identifiable information
- Explicitly clear Keychain entries when a user logs out
## Input & Data Validation
- Assume all external input is untrusted, including network responses, deep link parameters, and push notification payloads
- Validate and safely unwrap all optional or external data
- Fail gracefully when data is missing, malformed, or unexpected
## Privacy & Logging
- Use OSLog for structured logging
- Mark logs as public only for non-user, non-sensitive information
- Mark user-related data as private
- Do not log authentication data, full request/response payloads, or personal user content
## Biometric & Device Security
- Use Face ID or Touch ID only when it provides clear user value
- Always provide a fallback authentication path
- Do not assume biometric authentication is available or enabled
## Third-Party Dependencies
- Minimize third-party SDK usage
- Review SDK permissions and data collection behavior
- Avoid SDKs that collect unnecessary personal data or bypass Apple privacy protections
## Threat Model Assumptions
- The app does not attempt to protect against a fully compromised device, jailbroken OS, or advanced attackers
- The app does protect against accidental data leakage, insecure storage, insecure network transport, and common misuse of local persistence
## Guiding Principle
- Prefer well-documented Apple security APIs and defaults over custom or experimental solutions

# Testing & Quality

- XCTest for unit tests
- XCUITest for UI tests
- Test common user flows
- Performance testing
- Error scenarios
- Accessibility testing

# Essential Features

- Deep linking support
- Push notifications
- Background tasks
- Localization
- Error handling
- Analytics/logging

# Development Process

- Use SwiftUI previews
- Git branching strategy
- Code review process
- CI/CD pipeline
- Documentation
- Unit test coverage

# App Store Guidelines

- Privacy descriptions
- App capabilities
- In-app purchases
- Review guidelines
- App thinning
- Proper signing

Follow Apple's documentation for detailed implementation guidance.