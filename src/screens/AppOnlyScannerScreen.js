/**
 * APP-ONLY QR CODE SCANNER - Specialized Implementation
 * 
 * This scanner is specifically designed for app-related QR codes only.
 * It filters out all external QR codes and only processes app-specific ones.
 * 
 * USE CASES:
 * - User authentication via QR codes
 * - App-specific feature activation
 * - User verification and onboarding
 * - App-to-app communication
 * - Secure app access tokens
 * - App-specific data exchange
 * 
 * APPROACH FOLLOWED:
 * - Strict filtering: Only processes qrcodeapp:// URLs
 * - Rejects all external URLs (websites, phone, SMS, email)
 * - Shows rejection message for non-app QR codes
 * - Maintains separate scan history for app-only codes
 * - Provides clear feedback for app vs non-app codes
 * 
 * IMPLEMENTATION DETAILS:
 * - Uses same camera component but with different processing logic
 * - Implements strict URL validation for app codes
 * - Provides user feedback for rejected codes
 * - Maintains app-specific scan history
 * - Auto-navigation only for valid app deep links
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Clipboard
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function AppOnlyScannerScreen() {
  const navigation = useNavigation();
  const [flashOn, setFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showResultPage, setShowResultPage] = useState(false);
  const [currentScannedData, setCurrentScannedData] = useState(null);
  const [appScanHistory, setAppScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const cameraRef = useRef(null);

  // CAMERA SESSION FIX: Restart camera when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('App-only scanner screen focused - restarting camera');
      setTimeout(() => {
        restartCamera();
      }, 100);
    }, [])
  );

  /**
   * APP-ONLY QR CODE VALIDATION
   * 
   * This function validates if the scanned QR code is app-related.
   * Only processes qrcodeapp:// URLs and rejects everything else.
   */
  const validateAppQRCode = (data) => {
    console.log('Validating app QR code:', data);
    
    // Check if it's an app deep link
    if (data.startsWith('qrcodeapp://')) {
      return {
        isValid: true,
        type: 'App Deep Link',
        action: 'Navigate within app'
      };
    }
    
    // Reject all other types
    return {
      isValid: false,
      type: 'External/Invalid',
      action: 'Not app-related'
    };
  };

  /**
   * APP-ONLY SCANNING HANDLER
   * 
   * This function handles scanning with strict app-only filtering.
   * Only processes app-related QR codes and shows rejection for others.
   */
  const handleAppOnlyScannedData = (event) => {
    if (isScanning) {
      console.log('App-only scan blocked - already processing');
      return;
    }
    
    console.log('🎯 APP-ONLY SCAN EVENT RECEIVED:', event);
    const data = event.nativeEvent.codeStringValue;
    console.log('📱 APP-ONLY SCANNED DATA:', data);
    console.log('⏱️ App-only scan timestamp:', new Date().toISOString());

    setIsScanning(true);
    
    const validation = validateAppQRCode(data);
    
    // Add to app-specific scan history
    const newHistoryItem = {
      id: Date.now(),
      data: data,
      type: validation.type,
      isValid: validation.isValid,
      timestamp: new Date().toLocaleString(),
    };
    setAppScanHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);

    if (validation.isValid) {
      // Process valid app QR code
      console.log('Valid app QR code - processing automatically');
      handleAppDeepLinkNavigation(data);
    } else {
      // Show rejection for non-app QR codes
      console.log('Invalid/non-app QR code - showing rejection');
      setShowResultPage(true);
      setCurrentScannedData({ 
        data, 
        dataInfo: { 
          type: 'Rejected', 
          action: 'This QR code is not app-related',
          isValid: false
        } 
      });
    }
    
    // ULTRA-FAST SCANNING: Reset scanning state immediately
    setTimeout(() => {
      setIsScanning(false);
      console.log('App-only scanning state reset - ready for next scan');
    }, 100);
  };

  /**
   * APP DEEP LINK NAVIGATION HANDLER
   * 
   * Handles navigation for valid app deep links only.
   */
  const handleAppDeepLinkNavigation = (deepLinkUrl) => {
    try {
      console.log('Processing app deep link:', deepLinkUrl);
      
      // Extract path from app deep link
      const path = deepLinkUrl.split('qrcodeapp://')[1];
      console.log('App deep link path:', path);
      
      // Handle different app deep link patterns
      if (path.includes('user/')) {
        const userId = path.split('user/')[1];
        if (userId) {
          console.log('App navigation: UserDetail with ID:', userId);
          navigation.navigate('UserDetail', { id: userId });
        } else {
          console.log('App navigation: Users screen');
          navigation.navigate('Users');
        }
      } else if (path.includes('users')) {
        console.log('App navigation: Users screen');
        navigation.navigate('Users');
      } else if (path.includes('scanner')) {
        console.log('Already on App Scanner screen');
        Alert.alert('App Deep Link', 'Already on app scanner screen');
      } else if (path.includes('home')) {
        console.log('App navigation: Home screen');
        navigation.navigate('Home');
      } else {
        console.log('App navigation: Home (default)');
        navigation.navigate('Home');
      }
    } catch (error) {
      console.log('Error processing app deep link:', error);
      setShowResultPage(true);
      setCurrentScannedData({ 
        data: deepLinkUrl, 
        dataInfo: { 
          type: 'App Deep Link Error', 
          action: 'Navigation failed',
          isValid: false
        } 
      });
    }
  };

  /**
   * CAMERA RESTART FUNCTION
   */
  const restartCamera = () => {
    console.log('Restarting app-only camera...');
    setCameraKey(prev => prev + 1);
    setIsScanning(false);
    console.log('App-only camera restarted - ready for scanning');
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const copyToClipboard = () => {
    if (currentScannedData) {
      Clipboard.setString(currentScannedData.data);
      Alert.alert('Copied!', 'Data copied to clipboard');
    }
  };

  const renderAppHistoryItem = (item) => (
    <View key={item.id} style={[
      styles.historyItem,
      item.isValid ? styles.validHistoryItem : styles.invalidHistoryItem
    ]}>
      <Text style={styles.historyType}>
        {item.isValid ? '✅' : '❌'} {item.type}
      </Text>
      <Text style={styles.historyData} numberOfLines={2}>{item.data}</Text>
      <Text style={styles.historyTime}>{item.timestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Camera
        key={cameraKey}
        ref={cameraRef}
        style={styles.camera}
        scanBarcode={true}
        onReadCode={handleAppOnlyScannedData}
        showFrame={true}
        laserColor="blue"
        frameColor="white"
        cameraType="back"
        focusMode="on"
        zoomMode="on"
        flashMode={flashOn ? "on" : "off"}
        resizeMode="cover"
        ratioOverlayColor="rgba(0,0,0,0.3)"
        scanThrottleDelay={0}
        barcodeFrameSize={{ width: 200, height: 200 }} // OPTIMIZED: Reduced from 250px for faster detection
        onError={(error) => {
          console.log('App-only camera error:', error);
          Alert.alert('Camera Error', error.nativeEvent.errorMessage);
        }}
      />
      
      {/* Overlay Controls */}
      <View style={styles.overlay}>
        <View style={styles.topControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowHistory(true)}
          >
            <Text style={styles.controlButtonText}>📋</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={toggleFlash}
          >
            <Text style={styles.controlButtonText}>
              {flashOn ? '🔦' : '💡'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={restartCamera}
          >
            <Text style={styles.controlButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomControls}>
          <Text style={styles.instructionText}>
            {isScanning ? 'Processing app QR code...' : 'Point camera at APP QR code only'}
          </Text>
          <Text style={styles.warningText}>
            ⚠️ Only app-related QR codes will be processed
          </Text>
        </View>
      </View>

      {/* Result Page Modal */}
      <Modal
        visible={showResultPage}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.resultModalContent}>
            <View style={styles.resultHeader}>
              <Text style={styles.modalTitle}>
                {currentScannedData?.dataInfo?.isValid ? 'App QR Code' : 'Rejected QR Code'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowResultPage(false);
                  setTimeout(() => {
                    restartCamera();
                  }, 50);
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {currentScannedData && (
              <View style={styles.resultContent}>
                <View style={styles.resultTypeContainer}>
                  <Text style={styles.resultTypeLabel}>Status:</Text>
                  <Text style={[
                    styles.resultType,
                    currentScannedData.dataInfo.isValid ? styles.validType : styles.invalidType
                  ]}>
                    {currentScannedData.dataInfo.isValid ? '✅ Valid App Code' : '❌ Not App-Related'}
                  </Text>
                </View>
                
                <View style={styles.resultDataContainer}>
                  <Text style={styles.resultDataLabel}>Data:</Text>
                  <ScrollView style={styles.resultDataScroll}>
                    <Text style={styles.resultDataText}>{currentScannedData.data}</Text>
                  </ScrollView>
                </View>
                
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.copyButton]}
                    onPress={copyToClipboard}
                  >
                    <Text style={styles.actionButtonText}>📋 Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* App History Modal */}
      <Modal
        visible={showHistory}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.historyModalContent}>
            <View style={styles.historyHeader}>
              <Text style={styles.modalTitle}>App QR Code History</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowHistory(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyList}>
              {appScanHistory.length === 0 ? (
                <Text style={styles.emptyHistory}>No app QR codes scanned yet</Text>
              ) : (
                appScanHistory.map(renderAppHistoryItem)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 24,
    color: 'white',
  },
  bottomControls: {
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
    marginBottom: 10,
  },
  warningText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(255,107,107,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: width * 0.95,
    height: height * 0.8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  resultContent: {
    flex: 1,
    padding: 20,
  },
  resultTypeContainer: {
    marginBottom: 20,
  },
  resultTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  resultType: {
    fontSize: 18,
    padding: 10,
    borderRadius: 10,
    textAlign: 'center',
  },
  validType: {
    color: '#2ecc71',
    backgroundColor: '#d5f4e6',
  },
  invalidType: {
    color: '#e74c3c',
    backgroundColor: '#fadbd8',
  },
  resultDataContainer: {
    flex: 1,
    marginBottom: 20,
  },
  resultDataLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  resultDataScroll: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
  },
  resultDataText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
  },
  copyButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: width * 0.95,
    height: height * 0.8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyList: {
    flex: 1,
    padding: 20,
  },
  historyItem: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  validHistoryItem: {
    backgroundColor: '#d5f4e6',
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  invalidHistoryItem: {
    backgroundColor: '#fadbd8',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  historyType: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  historyData: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyHistory: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});