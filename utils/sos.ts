import * as Linking from "expo-linking";

export const sendWhatsApp = async (phone: string, text: string) => {
  const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
  const can = await Linking.canOpenURL(url);
  if (can) return Linking.openURL(url);
  return Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
};

export const makeCall = async (phone: string) => {
  return Linking.openURL(`tel:${phone}`);
};