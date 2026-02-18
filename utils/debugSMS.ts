import { Platform } from 'react-native';
import { sendAutomaticSOS } from './sendSOS';

export const testAutomaticSMSDebug = async () => {
  console.log('🧪 Testing Automatic SMS...');
  console.log('Platform:', Platform.OS);
  
  try {
    // Test with Bangalore coordinates
    const result = await sendAutomaticSOS(12.9716, 77.5946, 'DEBUG TEST');
    console.log('✅ Test completed, result:', result);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

export const checkPermissions = async () => {
  console.log('🔍 Checking permissions...');
  
  try {
    const { ensureSmsPermission } = await import('./smsPermission');
    const hasPermission = await ensureSmsPermission();
    console.log('SMS Permission:', hasPermission);
    
    const { ensureCallPermission } = await import('./callPermission');
    const hasCallPermission = await ensureCallPermission();
    console.log('Call Permission:', hasCallPermission);
    
  } catch (error) {
    console.error('Permission check failed:', error);
  }
};
