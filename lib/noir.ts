import {NativeModules} from 'react-native';
const {NoirModule} = NativeModules;

export async function generateProof(inputs: {[key: string]: any}) {
  const {proof, vkey} = await NoirModule.prove(inputs);
  return {
    // This is the full proof, including the inputs
    fullProof: proof,
    // The result contains the inputs concatenated to the proof
    // So we extract only the proof (the last 2144 bytes)
    proof: proof.slice(-4288),
    vkey,
  };
}

export async function verifyProof(proof: string, vkey: string) {
  const {verified} = await NoirModule.verify(proof, vkey);
  return verified;
}
