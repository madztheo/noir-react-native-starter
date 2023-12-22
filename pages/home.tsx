/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text} from 'react-native';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import {useNavigation} from '@react-navigation/native';

export default function Home() {
  const navigation = useNavigation();

  return (
    <MainLayout>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '500',
          marginBottom: 20,
          textAlign: 'center',
          color: '#6B7280',
        }}>
        This application shows you how to use Noir to generate ZK proofs
        natively in iOS and Android with React Native.{'\n\n'}
        Click on the button below to try out the demo and generate your first ZK
        proof straight from your phone!
      </Text>
      <Button
        onPress={() => {
          navigation.navigate('SimpleProof');
        }}>
        <Text
          style={{
            color: 'white',
            fontWeight: '700',
          }}>
          Continue
        </Text>
      </Button>
    </MainLayout>
  );
}
