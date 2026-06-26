import { registerRootComponent } from 'expo';
import React from 'react';
import { View } from 'react-native';
import App from './App';
import { AppToast, AppModal } from './AppModals';

function RootApp() {
  return (
    <View style={{ flex: 1 }}>
      <App />
      <AppToast />
      <AppModal />
    </View>
  );
}

registerRootComponent(RootApp);
