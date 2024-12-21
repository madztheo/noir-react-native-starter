/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {View, Text, Share, Alert, StyleSheet} from 'react-native';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/Button';
import {
  clearCircuit,
  extractProof,
  generateProof,
  setupCircuit,
  verifyProof,
} from '../lib/noir';
// Get the circuit to load for the proof generation
// Feel free to replace this with your own circuit
import circuit from '../circuits/secp256r1/target/secp256r1.json';
import {formatProof} from '../lib';
import {Circuit} from '../types';

export default function Secp256r1Proof() {
  const [proofAndInputs, setProofAndInputs] = useState('');
  const [proof, setProof] = useState('');
  const [vkey, setVkey] = useState('');
  const [generatingProof, setGeneratingProof] = useState(false);
  const [verifyingProof, setVerifyingProof] = useState(false);
  const [provingTime, setProvingTime] = useState(0);
  const [circuitId, setCircuitId] = useState<string>();

  useEffect(() => {
    // First call this function to load the circuit and setup the SRS for it
    // Keep the id returned by this function as it is used to identify the circuit
    setupCircuit(circuit as unknown as Circuit).then(id => setCircuitId(id));
    return () => {
      if (circuitId) {
        // Clean up the circuit after the component is unmounted
        clearCircuit(circuitId);
      }
    };
  }, []);

  const onGenerateProof = async () => {
    setGeneratingProof(true);
    try {
      // You can also preload the circuit separately using this function
      // await preloadCircuit(circuit);
      const start = Date.now();
      const {proofWithPublicInputs, vkey: _vkey} = await generateProof(
        {
          public_key_x: [
            8, 115, 220, 188, 4, 148, 236, 206, 160, 168, 66, 167, 49, 172, 127,
            40, 4, 237, 255, 39, 134, 80, 45, 198, 75, 120, 226, 225, 25, 186,
            167, 166,
          ],
          public_key_y: [
            48, 244, 109, 4, 181, 31, 195, 252, 151, 68, 109, 62, 232, 223, 145,
            160, 192, 244, 214, 76, 233, 105, 250, 65, 97, 118, 181, 238, 149,
            188, 97, 227,
          ],
          signature: [
            135, 158, 138, 110, 148, 39, 150, 7, 79, 143, 70, 22, 225, 192, 232,
            217, 48, 173, 57, 165, 91, 74, 239, 134, 249, 242, 221, 162, 85,
            153, 67, 91, 111, 240, 37, 162, 69, 238, 167, 234, 236, 104, 222,
            55, 111, 236, 54, 58, 132, 9, 115, 16, 60, 28, 253, 228, 112, 42,
            248, 193, 157, 7, 246, 233,
          ],
          message_hash: [
            137, 176, 207, 34, 13, 133, 76, 21, 244, 143, 220, 18, 201, 230, 9,
            192, 75, 133, 105, 73, 233, 97, 9, 164, 200, 116, 62, 82, 146, 207,
            62, 147,
          ],
        },
        circuitId!,
      );
      const end = Date.now();
      setProvingTime(end - start);
      setProofAndInputs(proofWithPublicInputs);
      setProof(
        extractProof(circuit as unknown as Circuit, proofWithPublicInputs),
      );
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
      const verified = await verifyProof(proofAndInputs, vkey, circuitId!);
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
        // The button is disabled as long as the circuit has not been setup
        // i.e. the circuitId is not defined
        <Button
          disabled={generatingProof || !circuitId}
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
