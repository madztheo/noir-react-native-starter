/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {View, Text, Share, Alert, StyleSheet} from 'react-native';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import {
  extractProof,
  generateProof,
  preloadCircuit,
  verifyProof,
} from '../lib/noir';
// Get the circuit to load for the proof generation
// Feel free to replace this with your own circuit
import circuit from '../circuits/pedersen/target/pedersen.json';
import {formatProof} from '../lib';
import {Circuit} from '../types';

export default function PedersenProof() {
  const [proofAndInputs, setProofAndInputs] = useState('');
  const [proof, setProof] = useState('');
  const [vkey, setVkey] = useState('');
  const [generatingProof, setGeneratingProof] = useState(false);
  const [verifyingProof, setVerifyingProof] = useState(false);
  const [inputs, setInputs] = useState({
    a: '',
    b: '',
  });
  const [provingTime, setProvingTime] = useState(0);
  const [circuitLoaded, setCircuitLoaded] = useState(false);

  useEffect(() => {
    preloadCircuit(circuit as Circuit, true).then(() => {
      setCircuitLoaded(true);
    });
  }, []);

  const onGenerateProof = async () => {
    if (!circuitLoaded) {
      Alert.alert('Circuit not loaded', 'Please wait for the circuit to load');
      return;
    }
    if (!inputs.a || !inputs.b) {
      Alert.alert('Invalid input', 'Please enter the inputs first');
      return;
    }
    setGeneratingProof(true);
    try {
      // You can also preload the circuit separately using this function
      // await preloadCircuit(circuit);
      const start = Date.now();
      const {proofWithPublicInputs, vkey: _vkey} = await generateProof(
        {
          a: Number(inputs.a),
          b: Number(inputs.b),
        },
        undefined,
        'honk',
      );
      const end = Date.now();
      setProvingTime(end - start);
      setProofAndInputs(proofWithPublicInputs);
      // Use the extractProof function to separate the proof from the public inputs
      // The explicit is necessary here as the circuit is not passed to the generate
      // proof function
      setProof(extractProof(circuit as Circuit, proofWithPublicInputs));
      setVkey(_vkey);
    } catch (err: any) {
      Alert.alert('Something went wrong', JSON.stringify(err));
      console.error(err);
    }
    setGeneratingProof(false);
  };

  const onVerifyProof = async () => {
    setVerifyingProof(true);
    try {
      // No need to provide the circuit here, as it was already loaded
      // during the proof generation
      const verified = await verifyProof(
        proofAndInputs,
        vkey,
        undefined,
        'honk',
      );
      if (verified) {
        Alert.alert('Verification result', 'The proof is valid!');
      } else {
        Alert.alert('Verification result', 'The proof is invalid');
      }
    } catch (err: any) {
      Alert.alert('Something went wrong', JSON.stringify(err));
      console.error(err);
    }
    setVerifyingProof(false);
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
        Prove that you know the pedersen hash of two numbers without revealing
        them{'\n'}(500 rounds ~ 150k constraints)
      </Text>
      <Text style={styles.sectionTitle}>Numbers</Text>
      <View
        style={{
          flexDirection: 'row',
          gap: 5,
          alignItems: 'center',
          marginBottom: 20,
        }}>
        <Input
          value={inputs.a}
          style={{
            flex: 1,
          }}
          placeholder="1st number"
          onChangeText={val => {
            setInputs(prev => ({...prev, a: val}));
          }}
        />
        <Text>&</Text>
        <Input
          style={{
            flex: 1,
          }}
          value={inputs.b}
          placeholder="2nd number"
          onChangeText={val => {
            setInputs(prev => ({...prev, b: val}));
          }}
        />
      </View>
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
            {formatProof(proof)}
          </Text>
        </>
      )}
      {proof && (
        <>
          <Text style={styles.sectionTitle}>Proving time</Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '400',
              textAlign: 'center',
              color: '#6B7280',
              marginBottom: 20,
            }}>
            {provingTime} ms
          </Text>
        </>
      )}
      {!proof && (
        <Button
          disabled={generatingProof || !circuitLoaded}
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
    color: '#151628',
    fontSize: 16,
    marginBottom: 5,
  },
});
