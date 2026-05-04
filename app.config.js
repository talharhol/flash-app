const palette = require('./constants/palette');

export default {
  "expo": {
    "newArchEnabled": true,
    "name": "flash-app",
    "slug": "flash-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/loggo.png",
    "scheme": "flash-app",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/loggo.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "icon": "./assets/images/loggo-ios.png",
      "supportsTablet": true,
      "googleServicesFile": process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/loggo-android.png",
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
      "@react-native-firebase/app",
      "@react-native-google-signin/google-signin",
      [
        "react-native-fast-tflite",
        {
          "enableCoreMLDelegate": true
        }
      ]
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
    "runtimeVersion": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/f5e2c7e4-6342-41e2-bb63-b8a94104db4c"
    },
    "androidStatusBar": {
      "backgroundColor": palette.backgroundDeep,
      "translucent": false
    }
  }
}
