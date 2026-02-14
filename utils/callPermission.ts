import { PermissionsAndroid, Platform } from "react-native";

export async function ensureCallPermission() {
  if (Platform.OS !== "android") return true;

  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.CALL_PHONE
  );

  if (granted) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CALL_PHONE
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}