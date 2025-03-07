export default {
  "expo": {
    "newArchEnabled": true,
    "name": "flash-app",
    "slug": "flash-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/loggo.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/loggo.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "googleServicesFile": process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/loggo.png",
        "backgroundColor": "#ffffff"
      },
      "googleServicesFile": process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      "package": "com.climbing.flashApp"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/loggo.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-sqlite",
      "@react-native-google-signin/google-signin"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "f5e2c7e4-6342-41e2-bb63-b8a94104db4c"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/f5e2c7e4-6342-41e2-bb63-b8a94104db4c"
    },
    "androidStatusBar": {
      "backgroundColor": "#A89070",
      "translucent": false
    }
  }
}
