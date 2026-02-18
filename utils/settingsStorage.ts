import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'safespot_settings';

export interface SafeSpotSettings {
  automaticSMS: boolean;
  nightSafety: boolean;
  silentSOS: boolean;
  lowBatteryMode: boolean;
}

export const defaultSettings: SafeSpotSettings = {
  automaticSMS: false,
  nightSafety: true,
  silentSOS: false,
  lowBatteryMode: true,
};

export const saveSettings = async (settings: Partial<SafeSpotSettings>): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const getSettings = async (): Promise<SafeSpotSettings> => {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
};

export const getAutomaticSMSSetting = async (): Promise<boolean> => {
  const settings = await getSettings();
  return settings.automaticSMS;
};
