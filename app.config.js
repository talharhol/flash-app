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
      "icon": {
        "dark": "./assets/images/ios-dark.png",
        "light": "./assets/images/ios-light.png"
      },
      "supportsTablet": true,
      "googleServicesFile": process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
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
      "./plugins/withOnnxRuntimeVersion",
      "expo-router",
      "expo-apple-authentication",
      "expo-font",
      "expo-sqlite",
      "@react-native-firebase/app",
      "@react-native-google-signin/google-signin",
      [
        "react-native-fast-tflite",
        {
          "enableCoreMLDelegate": true
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Allow flash-app to use your location to tag walls and find walls near you."
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
