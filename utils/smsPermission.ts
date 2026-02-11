import { PermissionsAndroid, Platform } from "react-native";

export const requestSMSPermission = async () => {
  if (Platform.OS !== "android") return false;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.SEND_SMS
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};