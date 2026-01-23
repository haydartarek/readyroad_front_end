# ReadyRoad Mobile App 📱

Flutter mobile application for ReadyRoad - Traffic Signs Learning Platform

## 🏗️ Architecture

```
lib/
├── core/
│   ├── constants/      # API URLs, Theme, App Constants
│   ├── network/        # HTTP Client (Dio)
│   └── di/            # Dependency Injection (GetIt)
├── features/
│   ├── home/          # Home Screen
│   ├── categories/    # Categories Feature
│   ├── signs/         # Traffic Signs Feature
│   ├── quiz/          # Quiz Feature (Coming Soon)
│   └── auth/          # Authentication (Coming Soon)
└── shared/
    ├── models/        # Data Models
    └── widgets/       # Reusable Widgets
```

## 🚀 Getting Started

### Prerequisites

- Flutter SDK 3.38.5+
- Dart 3.10.4+
- Backend running on `http://localhost:8080`

### Installation

```bash
# 1. Navigate to mobile app
cd mobile_app

# 2. Get dependencies
flutter pub get

# 3. Run the app
flutter run
```

## 🔧 Configuration

Edit `lib/core/constants/api_constants.dart` to change backend URL:

```dart
static const String baseUrl = 'http://localhost:8080';
```

**For Android Emulator:** Use `http://10.0.2.2:8080`
**For Physical Device:** Use your computer's IP address

## 📦 Dependencies

- **provider** - State Management
- **dio** - HTTP Client
- **get_it** - Dependency Injection
- **shared_preferences** - Local Storage
- **flutter_svg** - SVG Support
- **cached_network_image** - Image Caching

## ✅ Phase 0 - Mobile (Completed)

- ✅ Project Structure
- ✅ Network Layer (Dio)
- ✅ Dependency Injection (GetIt)
- ✅ Models (Category, TrafficSign)
- ✅ Services (CategoryService, TrafficSignService)
- ✅ Home Screen with Categories List
- ✅ Error Handling
- ✅ Pull to Refresh

## 🎯 Next Steps (Phase 1)

1. Sign Details Screen
2. Search & Filter
3. Favorites
4. Multilingual Support (ar/en/nl/fr)
5. Quiz Feature

## 🧪 Testing

```bash
# Run tests
flutter test

# Run with coverage
flutter test --coverage
```

## 📱 Run on Different Platforms

```bash
# Android
flutter run -d android

# iOS
flutter run -d ios

# Chrome (Web)
flutter run -d chrome
```

## 🔗 Backend Integration

This app connects to the ReadyRoad Spring Boot backend.

**Make sure the backend is running before starting the app!**

```bash
# Start backend (from project root)
cd ..
mvnw spring-boot:run
```

## 📄 License

MIT License - See LICENSE file

---

**Built with ❤️ using Flutter**

