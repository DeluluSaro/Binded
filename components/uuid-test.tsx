import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useThemeColors } from '../hooks/use-theme-color';

export const UuidTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Ready to test UUID');
  const colors = useThemeColors();

  const testUuid = () => {
    try {
      console.log('🧪 Testing UUID generation...');
      
      // Test UUID generation
      const uuid1 = uuidv4();
      const uuid2 = uuidv4();
      const uuid3 = uuidv4();
      
      console.log('✅ UUIDs generated:', { uuid1, uuid2, uuid3 });
      
      setTestResult(`✅ UUID Test Passed!\nUUID1: ${uuid1}\nUUID2: ${uuid2}\nUUID3: ${uuid3}`);
      
    } catch (error) {
      console.error('❌ UUID test failed:', error);
      setTestResult(`❌ UUID Test Failed: ${error}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        UUID Test
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={testUuid}
      >
        <Text style={styles.buttonText}>Test UUID Generation</Text>
      </TouchableOpacity>

      <Text style={[styles.result, { color: colors.text }]}>
        {testResult}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  result: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default UuidTest;
