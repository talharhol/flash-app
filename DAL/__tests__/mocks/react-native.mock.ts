// Minimal react-native mock for DAL tests.
// Image.resolveAssetSource is called in Wall/Group entity constructors and in tables.ts dumpers.

export const Image = {
  resolveAssetSource: jest.fn((source: any) => {
    if (source && typeof source === 'object' && source.uri) {
      return { uri: source.uri, width: 100, height: 100, scale: 1 };
    }
    return { uri: String(source ?? ''), width: 100, height: 100, scale: 1 };
  }),
};

export const ImageSourcePropType = {};
export const ImageResolvedAssetSource = {};
export const Platform = { OS: 'ios', select: (obj: any) => obj.ios ?? obj.default };
export const StyleSheet = { create: (s: any) => s, flatten: (s: any) => s };
export const View = 'View';
export const Text = 'Text';
export const TouchableOpacity = 'TouchableOpacity';
export const ActivityIndicator = 'ActivityIndicator';
export const Alert = { alert: jest.fn() };
