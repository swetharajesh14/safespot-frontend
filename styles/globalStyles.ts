import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C7C8F5",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  appTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 20,
  },

  heroImage: {
    width: "100%",
    height: 200,
    marginBottom: 20,
  },

  mainTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    color: "#F1F1F1",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
    marginRight: 8,
  },

  statusText: {
    fontSize: 13,
    color: "#FFFFFF",
  },

  instructionCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 24,
  },

  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  instructionText: {
    fontSize: 14,
    color: "#F3F4F6",
    lineHeight: 20,
  },

  primaryButton: {
    backgroundColor: "#A5F3FC",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 16,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },

  linkText: {
    fontSize: 14,
    color: "#E5E7EB",
    textDecorationLine: "underline",
  },
  title: {
  fontSize: 24,
  fontWeight: "700",
  color: "#1E1B4B",
  textAlign: "center",
  marginBottom: 12,
},

subtitle: {
  fontSize: 16,
  color: "#4C4B63",
  textAlign: "center",
  marginBottom: 30,
  lineHeight: 22,
},

button: {
  backgroundColor: "#6366F1",
  paddingVertical: 14,
  paddingHorizontal: 40,
  borderRadius: 30,
  marginTop: 30,
},

buttonText: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "600",
},

});
