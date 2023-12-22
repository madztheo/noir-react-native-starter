import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';

export default function Button({
  theme = 'primary',
  children,
  disabled,
  ...props
}: {
  theme?: 'primary' | 'secondary' | 'whiteRed' | 'transparent';
  disabled?: boolean;
  children: React.ReactNode;
} & React.ComponentProps<typeof TouchableOpacity>): JSX.Element {
  return (
    <TouchableOpacity
      {...props}
      disabled={disabled}
      style={[
        styles.general,
        styles[theme],
        props.style,
        disabled && styles.disabled,
      ]}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  general: {
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#151628',
    borderWidth: 1,
    borderColor: '#151628',
    gap: 5,
    color: 'white',
  },
  secondary: {
    backgroundColor: 'transparent',
    gap: 5,
    borderColor: '#151628',
    borderWidth: 1,
    color: '#192344',
  },
  whiteRed: {
    backgroundColor: '#FCFCFD',
    gap: 5,
    borderColor: '#E00',
    borderWidth: 1,
    color: '#E00',
  },
  transparent: {
    backgroundColor: 'transparent',
    gap: 5,
    color: '#195AFE',
  },
  disabled: {
    opacity: 0.5,
  },
});
