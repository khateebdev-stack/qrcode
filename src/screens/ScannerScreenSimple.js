import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, PermissionsAndroid, Platform } from 'react-native';
import { Camera } from 'react-native-camera-kit';

export default function ScannerScreenSimple() {
  const [flashOn, setFlashOn] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to scan QR codes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          Alert.alert('Permission denied', 'Camera permission is required to scan QR codes');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      setHasPermission(true);
    }
  };

  const handleScannedData = (event) => {
    console.log('Scan event received:', event);
    const data = event.nativeEvent.codeStringValue;
    console.log('Scanned Data:', data);
    
    Alert.alert('QR Code Scanned!', `Data: ${data}`);
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        scanBarcode={true}
        onReadCode={handleScannedData}
        showFrame={true}
        laserColor="red"
        frameColor="white"
        cameraType="back"
        focusMode="on"
        flashMode={flashOn ? "on" : "off"}
        resizeMode="cover"
        scanThrottleDelay={100}
        barcodeFrameSize={{ width: 250, height: 250 }}
        onError={(error) => {
          console.log('Camera error:', error);
          Alert.alert('Camera Error', error.nativeEvent.errorMessage);
        }}
      />
      
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.flashButton} 
          onPress={toggleFlash}
        >
          <Text style={styles.flashButtonText}>
            {flashOn ? '🔦' : '💡'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.bottomText}>
          <Text style={styles.instructionText}>
            Point camera at QR code to scan
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  flashButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  flashButtonText: {
    fontSize: 24,
    color: 'white',
  },
  bottomText: {
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
