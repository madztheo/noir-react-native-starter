import {NativeModules} from 'react-native';
import {Buffer} from 'buffer';
import elliptic from 'elliptic';
import {base64ToBytes, hexToBytes} from '.';

const LINKING_ERROR = 'Enclave Module is not linked';

const EnclaveModule = NativeModules.EnclaveModule
  ? NativeModules.EnclaveModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

const ALIAS: string = 'com.dry.app';
const CURVE = new elliptic.ec('p256');

function derToRS(der: number[]): [number[], number[]] {
  var offset: number = 3;
  var dataOffset;

  if (der[offset] == 0x21) {
    dataOffset = offset + 2;
  } else {
    dataOffset = offset + 1;
  }
  const r = der.slice(dataOffset, dataOffset + 32);
  offset = offset + der[offset] + 1 + 1;
  if (der[offset] == 0x21) {
    dataOffset = offset + 2;
  } else {
    dataOffset = offset + 1;
  }
  const s = der.slice(dataOffset, dataOffset + 32);
  return [r, s];
}

export async function formatSignature(base64Signature: string) {
  const signatureParsed = derToRS(base64ToBytes(base64Signature));
  const signature = [...signatureParsed[0], ...signatureParsed[1].slice(2)];
  return signature;
}

const formatPublicKey = (
  publicKeyBase64: string,
): {
  x: number[];
  y: number[];
} => {
  const publicKeyBuffer = Buffer.from(publicKeyBase64, 'base64');
  const publicKeyWithoutHeader = Uint8Array.prototype.slice.call(
    publicKeyBuffer,
    26,
  );
  const publicKey = CURVE.keyFromPublic(publicKeyWithoutHeader).getPublic();
  return {
    x: publicKey.getX().toArray('be', 32),
    y: publicKey.getY().toArray('be', 32),
  };
};

export async function getPublicKey(): Promise<{
  x: number[];
  y: number[];
}> {
  const publicKeyBase64 = await EnclaveModule.getPublicKey(ALIAS);
  return formatPublicKey(publicKeyBase64);
}

export async function generateKeyPair(): Promise<{
  x: number[];
  y: number[];
}> {
  const publicKeyBase64 = await EnclaveModule.generateKeyPair(ALIAS);
  return formatPublicKey(publicKeyBase64);
}

export async function deleteKeyPair(): Promise<void> {
  return await EnclaveModule.deleteKeyPair(ALIAS);
}

export async function signMessage(data: string): Promise<number[]> {
  const signatureBase64 = await EnclaveModule.signMessage(ALIAS, data);
  return formatSignature(signatureBase64);
}
