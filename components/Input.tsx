/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {TextInput} from 'react-native';

export default function Input({
  style,
  ...props
}: React.ComponentProps<typeof TextInput> & {style?: any}) {
  return (
    <TextInput
      {...props}
      style={{
        backgroundColor: '#FCFCFD',
        borderColor: '#E3EAFD',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: '#151628',
        ...style,
      }}
    />
  );
}
