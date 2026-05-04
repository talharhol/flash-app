import * as Location from 'expo-location';

export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        alert('Location permission denied');
        return null;
    }
    const pos = await Location.getCurrentPositionAsync({});
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}
