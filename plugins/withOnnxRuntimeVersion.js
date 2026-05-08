const { withProjectBuildGradle } = require('@expo/config-plugins');

const ONNX_VERSION = '1.24.3';

const withOnnxRuntimeVersion = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('onnxruntime-android-pinned')) {
      return config;
    }

    const resolutionBlock = `
    // onnxruntime-android-pinned: force version to avoid latest.integration maven resolution failure
    subprojects {
        configurations.all {
            resolutionStrategy {
                force "com.microsoft.onnxruntime:onnxruntime-android:${ONNX_VERSION}"
                force "com.microsoft.onnxruntime:onnxruntime-android-qnn:${ONNX_VERSION}"
                force "com.microsoft.onnxruntime:onnxruntime-extensions-android:${ONNX_VERSION}"
            }
        }
    }
`;

    config.modResults.contents += resolutionBlock;
    return config;
  });
};

module.exports = withOnnxRuntimeVersion;
