#!/bin/bash

# Device Tracker APK Build Script

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ANDROID_DIR="$SCRIPT_DIR/android"

echo "🔨 Device Tracker APK Builder"
echo "=============================="
echo ""

# Check for gradle
if ! command -v gradle &> /dev/null; then
    echo "📦 Setting up Gradle wrapper..."
    cd "$SCRIPT_DIR"
    npm install --legacy-peer-deps || true
fi

# Menu
echo "Select build type:"
echo "1) Debug APK (for testing)"
echo "2) Release APK (for production)"
echo "3) Install on device"
echo "4) Clean build"
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo "🔨 Building Debug APK..."
        cd "$ANDROID_DIR"
        chmod +x gradlew
        ./gradlew assembleDebug
        echo ""
        echo "✅ Debug APK built successfully!"
        echo "📱 Location: $ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
        ;;
    2)
        echo "🔐 Building Release APK..."
        source "$SCRIPT_DIR/android/.env.signing"
        cd "$ANDROID_DIR"
        chmod +x gradlew
        ./gradlew assembleRelease
        echo ""
        echo "✅ Release APK built successfully!"
        echo "📱 Location: $ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
        ;;
    3)
        echo "📲 Installing APK on device..."
        adb devices
        read -p "Enter APK type (debug/release): " apk_type
        if [ "$apk_type" = "debug" ]; then
            adb install "$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
        else
            adb install "$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
        fi
        echo "✅ APK installed successfully!"
        ;;
    4)
        echo "🧹 Cleaning build files..."
        cd "$ANDROID_DIR"
        ./gradlew clean
        echo "✅ Build cleaned!"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
