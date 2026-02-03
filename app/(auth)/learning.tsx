import { View, Text, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import PulseRing from "../../components/PulseRing";
import { globalStyles } from "../../styles/globalStyles";

export default function LearningScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 1));
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={globalStyles.container}>
      <PulseRing />

      <Text style={[globalStyles.title, { marginTop: 40 }]}>
        SafeSpot is learning you
      </Text>

      <Text style={globalStyles.subtitle}>
        Please stay still for a moment.{"\n"}
        This helps SafeSpot understand your normal movement.
      </Text>

      <Text style={{ fontSize: 14, color: "#4338CA" }}>
        Learning progress: {progress}%
      </Text>

      {progress >= 100 && (
        <TouchableOpacity
          style={globalStyles.button}
          onPress={() => router.replace("/(home)")}
        >
          <Text style={globalStyles.buttonText}>Continue</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
