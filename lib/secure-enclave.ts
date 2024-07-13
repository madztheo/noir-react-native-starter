import {NativeModules} from 'react-native';
import {base64ToHex, bigIntToBytes, bytesToBigInt, hexToBytes} from '.';
import {p256} from '@noble/curves/p256';

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

const derPrefix = '3059301306072a8648ce3d020106082a8648ce3d03010703420004';

export function isDERPubKey(pubKeyHex: string): boolean {
  return (
    pubKeyHex.startsWith(derPrefix) &&
    pubKeyHex.length === derPrefix.length + 128
  );
}

export function formatPublicKey(base64Signature: string): {
  x: number[];
  y: number[];
} {
  const pubKeyHex = base64ToHex(base64Signature);
  if (!isDERPubKey(pubKeyHex)) {
    throw new Error('Invalid public key format');
  }

  const pubKey = pubKeyHex.substring(derPrefix.length);
  if (pubKey.length !== 128) {
    throw new Error('Invalid public key length');
  }

  const key1 = `0x${pubKey.substring(0, 64)}`;
  const key2 = `0x${pubKey.substring(64)}`;
  return {x: hexToBytes(key1), y: hexToBytes(key2)};
}

export function parseAndNormalizeSig(derSig: string): number[] {
  const parsedSignature = p256.Signature.fromDER(derSig);
  const bSig = hexToBytes(`0x${parsedSignature.toCompactHex()}`);
  if (bSig.length !== 64) {
    throw new Error('Invalid signature length');
  }
  const bR = bSig.slice(0, 32);
  const bS = bSig.slice(32);

  // Avoid malleability. Ensure low S (<= N/2 where N is the curve order)
  const r = bytesToBigInt(bR);
  let s = bytesToBigInt(bS);
  const n = BigInt(
    '0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551',
  );
  if (s > n / 2n) {
    s = n - s;
  }
  return [...bigIntToBytes(r), ...bigIntToBytes(s)];
}

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
  return parseAndNormalizeSig(base64ToHex(signatureBase64));
}
