import {Buffer} from 'buffer';

export function formatProof(proof: string) {
  const length = proof.length;
  return `${proof.substring(0, 100)}...${proof.substring(
    length - 100,
    length,
  )}`;
}

export function stringToBytes(str: string): number[] {
  return Buffer.from(str).toJSON().data;
}

export function hexToBytes(hex: string): number[] {
  let formattedHex = hex;
  if (formattedHex.startsWith('0x')) {
    formattedHex = formattedHex.slice(2);
  }
  return formattedHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
}

export function base64ToBytes(base64: string): number[] {
  return Array.from(Buffer.from(base64, 'base64'));
}

export function bytesToHex(bytes: number[]): string {
  return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function reverseArray(arr: any[]) {
  return arr.slice().reverse();
}
