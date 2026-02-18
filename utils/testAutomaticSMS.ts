import { sendAutomaticSOS } from './sendSOS';

export const testAutomaticSMS = async () => {
  try {
    console.log('Testing automatic SMS...');
    
    // Test with sample coordinates (Bangalore)
    const testLat = 12.9716;
    const testLng = 77.5946;
    
    await sendAutomaticSOS(testLat, testLng, 'Test Automatic SOS');
    
    console.log('Automatic SMS test completed');
  } catch (error) {
    console.error('Automatic SMS test failed:', error);
  }
};
