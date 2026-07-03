import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Alert } from 'react-native';
import App from './App';
import { AppToast, AppModal } from './AppModals';

// Global JS error catcher — shows the error as an alert so we can diagnose OTA crashes
const _origHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  try {
    Alert.alert(
      'Debug Crash',
      (error && error.message ? error.message : String(error)) +
        '\n\n' +
        (error && error.stack ? error.stack.substring(0, 400) : ''),
      [{ text: 'OK' }]
    );
  } catch (_) {}
  if (_origHandler) _origHandler(error, isFatal);
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    try {
      Alert.alert(
        'Render Crash',
        (error && error.message ? error.message : String(error)) +
          '\n\n' +
          (error && error.stack ? error.stack.substring(0, 400) : ''),
        [{ text: 'OK' }]
      );
    } catch (_) {}
  }
  render() {
    if (this.state.error) {
      return null;
    }
    return this.props.children;
  }
}

function RootApp() {
  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <App />
        <AppToast />
        <AppModal />
      </View>
    </ErrorBoundary>
  );
}

registerRootComponent(RootApp);
