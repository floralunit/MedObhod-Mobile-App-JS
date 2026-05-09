import React from 'react';
import { StatusBar, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const SafeScreen = ({ children, backgroundColor = '#fff', barStyle = 'dark-content' }) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <StatusBar 
        barStyle={barStyle} 
        backgroundColor={backgroundColor}
        translucent={false}
      />
      {children}
    </SafeAreaView>
  );
};