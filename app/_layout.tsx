import { Stack } from "expo-router";
import "../tasks/locationTask";


export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
