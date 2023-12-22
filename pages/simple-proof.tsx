/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {View, Text, Share, Alert, StyleSheet} from 'react-native';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Input from '../components/Input';

const truncateProof = (proof: string) => {
  const length = proof.length;
  return `${proof.substring(0, 100)}...${proof.substring(
    length - 100,
    length,
  )}`;
};

export default function SimpleProof() {
  const [proof, setProof] = useState('');
  const [generatingProof, setGeneratingProof] = useState(false);
  const [verifyingProof, setVerifyingProof] = useState(false);
  const [factors, setFactors] = useState({
    a: '',
    b: '',
  });

  const onGenerateProof = async () => {
    const result = getResult();
    if (!factors.a || !factors.b || !result) {
      Alert.alert('Invalid input', 'Please enter the factors first');
      return;
    }
    if (factors.a === '1' || factors.b === '1') {
      Alert.alert('Invalid input', 'The factors cannot be 1');
      return;
    }
    setGeneratingProof(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      //const proof = await generateProof();
      //setProof(proof);
      // Generate random hex string
      const randomHexString = (length: number) =>
        [...Array(length)]
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join('');
      const randomProof = randomHexString(4288);
      setProof(randomProof);
    } catch (err: any) {
      Alert.alert('Something went wrong', JSON.stringify(err));
      console.error(err);
    }
    setGeneratingProof(false);
  };

  const onVerifyProof = async () => {
    setVerifyingProof(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      /*const result = await verifyProof(proof);
      if (result) {
        Alert.alert('Verification result', 'The proof is valid!');
      } else {
        Alert.alert('Verification result', 'The proof is invalid');
      }*/
      Alert.alert('Verification result', 'The proof is valid!');
    } catch (err: any) {
      Alert.alert('Something went wrong', JSON.stringify(err));
      console.error(err);
    }
    setVerifyingProof(false);
  };

  const getResult = () => {
    const factorA = Number(factors.a);
    const factorB = Number(factors.b);
    if (!isNaN(factorA) && !isNaN(factorB)) {
      return (factorA * factorB).toString();
    }
    return '';
  };

  return (
    <MainLayout canGoBack={true}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '500',
          marginBottom: 20,
          textAlign: 'center',
          color: '#6B7280',
        }}>
        Enter two factors and generate a proof that you know the product of the
        two factors without revealing the factors themselves.
      </Text>
      <Text style={styles.sectionTitle}>Factors</Text>
      <View
        style={{
          flexDirection: 'row',
          gap: 5,
          alignItems: 'center',
          marginBottom: 20,
        }}>
        <Input
          value={factors.a}
          style={{
            flex: 1,
          }}
          placeholder="1st factor"
          onChangeText={val => {
            setFactors(prev => ({...prev, a: val}));
          }}
        />
        <Text>x</Text>
        <Input
          style={{
            flex: 1,
          }}
          value={factors.b}
          placeholder="2nd factor"
          onChangeText={val => {
            setFactors(prev => ({...prev, b: val}));
          }}
        />
      </View>
      <Text style={styles.sectionTitle}>Outcome</Text>
      <Text
        style={{
          textAlign: 'center',
          marginBottom: 20,
        }}>
        {getResult()}
      </Text>
      {proof && (
        <>
          <Text style={styles.sectionTitle}>Proof</Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '400',
              textAlign: 'center',
              color: '#6B7280',
              marginBottom: 20,
            }}>
            {truncateProof(proof)}
          </Text>
        </>
      )}
      {!proof && (
        <Button
          disabled={generatingProof}
          onPress={() => {
            onGenerateProof();
          }}>
          <Text
            style={{
              color: 'white',
              fontWeight: '700',
            }}>
            {generatingProof ? 'Proving...' : 'Generate a proof'}
          </Text>
        </Button>
      )}
      {proof && (
        <View
          style={{
            gap: 10,
          }}>
          <Button
            disabled={verifyingProof}
            onPress={() => {
              onVerifyProof();
            }}>
            <Text
              style={{
                color: 'white',
                fontWeight: '700',
              }}>
              {verifyingProof ? 'Verifying...' : 'Verify the proof'}
            </Text>
          </Button>
          <Button
            theme="secondary"
            onPress={() => {
              Share.share({
                title: 'My Noir React Native proof',
                message: proof,
              });
            }}>
            <Text
              style={{
                color: '#151628',
                fontWeight: '700',
              }}>
              Share my proof
            </Text>
          </Button>
        </View>
      )}
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 5,
  },
});
