import { PermissionsAndroid, Platform } from "react-native";

export async function ensureSmsPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return false;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    {
      title: "SMS Permission",
      message: "SafeSpot needs SMS permission to send emergency alerts automatically.",
      buttonPositive: "Allow",
      buttonNegative: "Deny",
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}