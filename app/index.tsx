import { Redirect } from "expo-router";

export default function Index() {
  // change this later after login logic
  return <Redirect href="/(auth)/onboarding" />;
}
