/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {View, Text, Share, Alert, StyleSheet} from 'react-native';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import {generateProof, preloadCircuit, verifyProof} from '../lib/noir';
// Get the circuit to load for the proof generation
// Feel free to replace this with your own circuit
import circuit from '../circuits/secp256r1/target/secp256r1.json';
import {formatProof, hexToBytes, reverseArray, stringToBytes} from '../lib';
import {
  generateKeyPair,
  getPublicKey,
  signMessage,
} from '../lib/secure-enclave';
import {sha256} from 'ethers/lib/utils';

export default function Secp256r1Proof() {
  const [proofAndInputs, setProofAndInputs] = useState('');
  const [proof, setProof] = useState('');
  const [vkey, setVkey] = useState('');
  const [generatingProof, setGeneratingProof] = useState(false);
  const [verifyingProof, setVerifyingProof] = useState(false);
  const [provingTime, setProvingTime] = useState(0);

  const onGenerateProof = async () => {
    setGeneratingProof(true);
    try {
      // You can also preload the circuit separately using this function
      // await preloadCircuit(circuit);
      let publicKey: {
        x: number[];
        y: number[];
      };
      try {
        publicKey = await getPublicKey();
      } catch (err) {
        publicKey = await generateKeyPair();
        return;
      }
      const messageBytes = stringToBytes('Hello Noir');
      const messageHash = sha256(messageBytes);
      const signature = await signMessage('Hello Noir');
      //const signature = await signMessage(messageHash);
      // Convert to bytes array
      console.log('messageHash', messageHash);
      const messageHashArray = hexToBytes(messageHash);
      const start = Date.now();
      console.log('publicKey', publicKey);
      console.log('signature', signature);
      console.log('messageHashArray', messageHashArray);
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          for (let k = 0; k < 2; k++) {
            try {
              const {
                fullProof,
                proof: _proof,
                vkey: _vkey,
              } = await generateProof(
                {
                  public_key_x:
                    i === 0 ? publicKey.x : reverseArray(publicKey.x),
                  public_key_y:
                    i === 0 ? publicKey.y : reverseArray(publicKey.y),
                  signature: j === 0 ? signature : reverseArray(signature),
                  message_hash:
                    k === 0 ? messageHashArray : reverseArray(messageHashArray),
                },
                // We load the circuit at the same time as the proof generation
                // but you can use the preloadCircuit function to load it beforehand
                circuit,
                'plonk',
              );
              const end = Date.now();
              setProvingTime(end - start);
              setProofAndInputs(fullProof);
              setProof(_proof);
              setVkey(_vkey);
              Alert.alert('Proof generated', 'Proof generated successfully');
            } catch (error) {
              console.error('Error', error);
            }
          }
        }
      }
      /*const {
        fullProof,
        proof: _proof,
        vkey: _vkey,
      } = await generateProof(
        {
          public_key_x: publicKey.x,
          public_key_y: publicKey.y,
          signature: signature,
          message_hash: messageHashArray,
        },
        // We load the circuit at the same time as the proof generation
        // but you can use the preloadCircuit function to load it beforehand
        circuit,
        'plonk',
      );
      const end = Date.now();
      setProvingTime(end - start);
      setProofAndInputs(fullProof);
      setProof(_proof);
      setVkey(_vkey);*/
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
        'plonk',
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
        Generate a proof over a pre-defined secp256r1 (or P-256) key pair and
        signature
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
    color: '#151628',
    fontSize: 16,
    marginBottom: 5,
  },
});
