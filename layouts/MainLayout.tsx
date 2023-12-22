/* eslint-disable react-native/no-inline-styles */
import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';

export default function MainLayout({
  children,
  canGoBack = false,
}: {
  children: React.ReactNode;
  canGoBack?: boolean;
}): JSX.Element {
  const navigation = useNavigation();
  return (
    <SafeAreaView
      style={{
        backgroundColor: '#F6F8FE',
      }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FE" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{
          backgroundColor: '#F6F8FE',
          height: '100%',
        }}>
        <View
          style={{
            paddingVertical: 20,
            paddingHorizontal: 20,
          }}>
          {canGoBack && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 30,
              }}>
              <TouchableOpacity
                style={{flexDirection: 'row', alignItems: 'center', gap: 9}}
                onPress={() => {
                  navigation.goBack();
                }}>
                <Image
                  source={require('../assets/images/icons/arrow-left.png')}
                  resizeMode="contain"
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
                <Text
                  style={{color: '#195AFE', fontSize: 14, fontWeight: '700'}}>
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Image
            source={require('../assets/images/logo.png')}
            resizeMode="contain"
            style={{
              width: 100,
              height: 100,
              marginLeft: 'auto',
              marginRight: 'auto',
              borderRadius: 20,
              marginBottom: 15,
            }}
          />
          <Text
            style={{
              textAlign: 'center',
              fontSize: 22,
              fontWeight: 'bold',
              // Purple
              color: '#151628',
              marginBottom: 30,
            }}>
            Noir React Native Starter
          </Text>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
