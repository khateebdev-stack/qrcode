/**
 * QR Code Scanner Screen - Advanced Implementation
 * 
 * This file contains the main QR code scanner functionality with the following features:
 * 
 * CHANGES MADE:
 * 1. Replaced react-native-vision-camera with react-native-camera-kit for better compatibility
 * 2. Added automatic processing for known QR types (Website, Phone, SMS, Email, Deep Links)
 * 3. Implemented automatic in-app navigation for deep links without user interaction
 * 4. Added result page with copy/search functionality for unknown QR types
 * 5. Fixed camera session issues to allow continuous scanning without killing app
 * 6. Added camera restart functionality and focus management
 * 7. Removed test buttons for production use
 * 8. Added comprehensive error handling and console logging
 * 
 * PROBLEMS SOLVED:
 * - Camera only scanning once: Fixed with automatic state reset and camera restart
 * - Deep links not navigating: Implemented proper URL parsing and navigation
 * - Alerts interrupting user flow: Auto-process known types, show page for unknown
 * - Session killing required: Added automatic camera recovery mechanisms
 * 
 * DEPENDENCIES USED:
 * - react-native-camera-kit: For camera functionality
 * - @react-navigation/native: For navigation
 * - React Native built-ins: Linking, Alert, Modal, Clipboard
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Linking,
  Alert,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
  Clipboard,
  AppState
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen() {
  const navigation = useNavigation();
  const [flashOn, setFlashOn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showResultPage, setShowResultPage] = useState(false);
  const [currentScannedData, setCurrentScannedData] = useState(null);
  const [cameraKey, setCameraKey] = useState(0); // Key to force camera re-render
  const cameraRef = useRef(null);

  // CAMERA SESSION FIX: Restart camera when screen comes into focus
  // This solves the issue where camera stops working after navigation
  useFocusEffect(
    React.useCallback(() => {
      console.log('Scanner screen focused - restarting camera');
      setTimeout(() => {
        restartCamera();
      }, 100); // Ultra-fast delay for immediate camera restart
    }, [])
  );

  /**
   * QR CODE TYPE IDENTIFICATION
   * 
   * This function identifies different types of QR codes and returns appropriate metadata.
   * This enables automatic processing for known types and proper handling for unknown types.
   * 
   * SUPPORTED TYPES:
   * - Website URLs (http/https)
   * - Phone numbers (tel:)
   * - SMS messages (sms:)
   * - Email addresses (mailto:)
   * - Contact vCards (BEGIN:VCARD...END:VCARD)
   * - Calendar events (BEGIN:VEVENT...END:VEVENT)
   * - App deep links (qrcodeapp://)
   * - Plain text (default)
   */
  const identifyDataType = (data) => {
    // Website URLs - Auto-open in browser
    if (data.match(/^https?:\/\/.+/i)) {
      return { type: 'Website', action: 'Open in browser' };
    }
    // Phone numbers - Auto-open dialer
    if (data.startsWith('tel:')) {
      return { type: 'Phone', action: 'Open dialer' };
    }
    // SMS messages - Auto-open SMS app
    if (data.startsWith('sms:')) {
      return { type: 'SMS', action: 'Open SMS app' };
    }
    // Email addresses - Auto-open email client
    if (data.startsWith('mailto:')) {
      return { type: 'Email', action: 'Open email client' };
    }
    // Contact vCards - Show result page for manual handling
    if (data.startsWith('BEGIN:VCARD') && data.includes('END:VCARD')) {
      return { type: 'Contact vCard', action: 'Parse → add contact' };
    }
    // Calendar events - Show result page for manual handling
    if (data.startsWith('BEGIN:VEVENT') && data.includes('END:VEVENT')) {
      return { type: 'Calendar', action: 'Add event' };
    }
    // App deep links - Auto-navigate within app
    if (data.startsWith('qrcodeapp://')) {
      return { type: 'App deep link', action: 'Navigate inside your app' };
    }
    // Default - Plain text, show result page
    return { type: 'Text', action: 'Display content' };
  };

  /**
   * MAIN SCANNING HANDLER - CORE FUNCTIONALITY
   * 
   * This function handles all scanned QR codes and implements the smart processing logic:
   * 
   * AUTOMATIC PROCESSING (No user interaction):
   * - Website URLs → Open in browser
   * - Phone numbers → Open dialer
   * - SMS messages → Open SMS app
   * - Email addresses → Open email client
   * - App deep links → Navigate within app
   * 
   * MANUAL PROCESSING (Show result page):
   * - Plain text → Show with copy/search options
   * - Contact vCards → Show for manual handling
   * - Calendar events → Show for manual handling
   * 
   * CAMERA SESSION FIX:
   * - Automatic state reset after 2 seconds
   * - Prevents rapid re-scanning
   * - Enables continuous scanning without killing app
   */
  const handleScannedData = (event) => {
    if (isScanning) {
      console.log('Scan blocked - already processing');
      return; // Prevent multiple rapid scans
    }
    
    console.log('🎯 SCAN EVENT RECEIVED:', event);
    const data = event.nativeEvent.codeStringValue;
    console.log('📱 SCANNED DATA:', data);
    console.log('⏱️ Scan timestamp:', new Date().toISOString());

    setIsScanning(true);
    
    const dataInfo = identifyDataType(data);
    
    // Add to scan history (keeps last 50 items)
    const newHistoryItem = {
      id: Date.now(),
      data: data,
      type: dataInfo.type,
      timestamp: new Date().toLocaleString(),
    };
    setScanHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);

    // SMART PROCESSING: Auto-process known types, show page for unknown types
    if (dataInfo.type === 'Website' || dataInfo.type === 'Phone' || dataInfo.type === 'SMS' || 
        dataInfo.type === 'Email' || dataInfo.type === 'App deep link') {
      // Auto-process known types (including deep links) - NO USER INTERACTION
      executeAction(data, dataInfo);
    } else {
      // Show result page for unknown types (Text, Contact vCard, Calendar, etc.)
      setShowResultPage(true);
      setCurrentScannedData({ data, dataInfo });
    }
    
    // ULTRA-FAST SCANNING: Reset scanning state immediately for microsecond speed
    setTimeout(() => {
      setIsScanning(false);
      console.log('Scanning state reset - ready for next scan');
    }, 100); // 100ms delay for ultra-fast scanning
  };

  const executeAction = (data, dataInfo) => {
    try {
      switch (dataInfo.type) {
        case 'Website':
          Linking.openURL(data);
          break;
        case 'Phone':
          Linking.openURL(data);
          break;
        case 'SMS':
          Linking.openURL(data);
          break;
        case 'Email':
          Linking.openURL(data);
          break;
        case 'App deep link':
          // Handle deep link navigation automatically
          console.log('Processing App Deep Link:', data);
          handleDeepLinkNavigation(data);
          break;
        case 'Contact vCard':
          console.log('Contact vCard:', data);
          // Show result page for vCard
          setShowResultPage(true);
          setCurrentScannedData({ data, dataInfo });
          break;
        case 'Calendar':
          console.log('Calendar Event:', data);
          // Show result page for calendar
          setShowResultPage(true);
          setCurrentScannedData({ data, dataInfo });
          break;
        default:
          console.log('Unknown data type:', data);
      }
    } catch (error) {
      console.log('Error processing action:', error);
      // Show result page on error
      setShowResultPage(true);
      setCurrentScannedData({ data, dataInfo: { type: 'Error', action: 'Could not process' } });
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const handleManualInput = () => {
    if (manualInput.trim()) {
      const dataInfo = identifyDataType(manualInput.trim());
      handleScannedData({ nativeEvent: { codeStringValue: manualInput.trim() } });
      setManualInput('');
      setShowManualInput(false);
    }
  };

  const copyToClipboard = () => {
    if (currentScannedData) {
      Clipboard.setString(currentScannedData.data);
      Alert.alert('Copied!', 'Data copied to clipboard');
    }
  };

  const searchOnWeb = () => {
    if (currentScannedData) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(currentScannedData.data)}`;
      Linking.openURL(searchUrl);
    }
  };

  /**
   * CAMERA RESTART FUNCTION
   * 
   * PROBLEM SOLVED: Camera stops working after first scan, requiring app restart
   * SOLUTION: Force camera re-render using key prop and reset scanning state
   * 
   * HOW IT WORKS:
   * - Changes cameraKey to force React to re-render the Camera component
   * - Resets isScanning state to allow new scans
   * - Logs restart for debugging purposes
   * 
   * USED IN:
   * - Manual restart button (🔄)
   * - Screen focus effect (when returning to scanner)
   * - Result page close (when returning to scanning)
   */
  const restartCamera = () => {
    console.log('Restarting camera...');
    setCameraKey(prev => prev + 1); // Force camera re-render
    setIsScanning(false);
    console.log('Camera restarted - ready for scanning');
  };

  /**
   * DEEP LINK NAVIGATION HANDLER
   * 
   * This function handles automatic in-app navigation for deep link QR codes.
   * 
   * PROBLEM SOLVED: Deep links were not automatically navigating within the app
   * SOLUTION: Implemented automatic navigation without user interaction
   * 
   * SUPPORTED DEEP LINK PATTERNS:
   * - qrcodeapp://user/123 → Navigate to UserDetail screen with ID 123
   * - qrcodeapp://users → Navigate to Users screen
   * - qrcodeapp://home → Navigate to Home screen
   * - qrcodeapp://scanner → Stay on Scanner screen
   * - qrcodeapp://profile → Navigate to Users screen
   * - qrcodeapp://dashboard → Navigate to Home screen
   * - Default → Navigate to Home screen
   * 
   * IMPLEMENTATION DETAILS:
   * - Uses simple string parsing (no URL constructor for React Native compatibility)
   * - Automatic navigation without alerts or user interaction
   * - Fallback to result page if parsing fails
   * - Console logging for debugging
   */
  const handleDeepLinkNavigation = (deepLinkUrl) => {
    try {
      console.log('Processing deep link:', deepLinkUrl);
      
      // Simple string parsing instead of URL constructor (React Native compatibility)
      let path = '';
      let params = {};
      
      // Extract path from deep link
      if (deepLinkUrl.includes('://')) {
        const parts = deepLinkUrl.split('://');
        if (parts.length > 1) {
          path = parts[1];
        }
      } else {
        path = deepLinkUrl;
      }
      
      console.log('Deep link path:', path);
      
      // AUTO NAVIGATION: Handle different deep link patterns automatically
      if (path.includes('user/')) {
        // Extract user ID from path like user/123
        const userId = path.split('user/')[1];
        if (userId) {
          console.log('Auto-navigating to UserDetail with ID:', userId);
          navigation.navigate('UserDetail', { id: userId });
        } else {
          console.log('Auto-navigating to Users screen');
          navigation.navigate('Users');
        }
      } else if (path.includes('users')) {
        console.log('Auto-navigating to Users screen');
        navigation.navigate('Users');
      } else if (path.includes('scanner')) {
        console.log('Already on Scanner screen - no action needed');
        // Already on scanner, no need to navigate
      } else if (path.includes('home')) {
        console.log('Auto-navigating to Home screen');
        navigation.navigate('Home');
      } else if (path.includes('profile')) {
        console.log('Auto-navigating to Users screen (profile)');
        navigation.navigate('Users');
      } else if (path.includes('dashboard')) {
        console.log('Auto-navigating to Home screen (dashboard)');
        navigation.navigate('Home');
      } else {
        // Default navigation to home
        console.log('Auto-navigating to Home (default)');
        navigation.navigate('Home');
      }
    } catch (error) {
      console.log('Error parsing deep link:', error);
      // Fallback: show result page if navigation fails
      setShowResultPage(true);
      setCurrentScannedData({ 
        data: deepLinkUrl, 
        dataInfo: { type: 'App deep link', action: 'Navigation failed' } 
      });
    }
  };

  const renderHistoryItem = (item) => (
    <View key={item.id} style={styles.historyItem}>
      <Text style={styles.historyType}>{item.type}</Text>
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
        onReadCode={handleScannedData}
        showFrame={true}
        laserColor="red"
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
          console.log('Camera error:', error);
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

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowManualInput(true)}
          >
            <Text style={styles.controlButtonText}>✍️</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomControls}>
          <Text style={styles.instructionText}>
            {isScanning ? 'Processing scan...' : 'Point camera at QR code to scan'}
          </Text>
        </View>
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manual Input</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter QR code data manually..."
              value={manualInput}
              onChangeText={setManualInput}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowManualInput(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]} 
                onPress={handleManualInput}
              >
                <Text style={styles.modalButtonText}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.historyModalContent}>
            <View style={styles.historyHeader}>
              <Text style={styles.modalTitle}>Scan History</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowHistory(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyList}>
              {scanHistory.length === 0 ? (
                <Text style={styles.emptyHistory}>No scan history yet</Text>
              ) : (
                scanHistory.map(renderHistoryItem)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Result Page Modal */}
      <Modal
        visible={showResultPage}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.resultModalContent}>
            <View style={styles.resultHeader}>
              <Text style={styles.modalTitle}>Scanned Result</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowResultPage(false);
                  // Restart camera when result page is closed
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
                  <Text style={styles.resultTypeLabel}>Type:</Text>
                  <Text style={styles.resultType}>{currentScannedData.dataInfo.type}</Text>
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
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.searchButton]}
                    onPress={searchOnWeb}
                  >
                    <Text style={styles.actionButtonText}>🔍 Search</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
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
  historyList: {
    flex: 1,
    padding: 20,
  },
  historyItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  historyType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
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
    color: '#007AFF',
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 10,
    textAlign: 'center',
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
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: '#34C759',
  },
  searchButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
