// documentDirectory uses 'file:///test/' prefix so convertToLocalImage()
// in tables.ts detects it as already local and returns the URI unchanged.
export const documentDirectory = 'file:///test/';
export const downloadAsync = jest.fn().mockResolvedValue({ status: 200, uri: 'file:///test/downloaded.png' });
export const copyAsync = jest.fn().mockResolvedValue(undefined);
export const getInfoAsync = jest.fn().mockResolvedValue({ exists: false, isDirectory: false, size: 0 });
export const deleteAsync = jest.fn().mockResolvedValue(undefined);
export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined);
export const readAsStringAsync = jest.fn().mockResolvedValue('');
export const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
export const cacheDirectory = 'file:///test/cache/';
