# Noir React Native starter

## Description

This is a simple React Native app showcasing how to use Noir in a mobile app (both for iOS and Android) to generate and verify proofs directly on mobile phones.

## Mobile proving

### iOS

The app integrates with the [Swoir library](https://github.com/Swoir/Swoir) to generate proofs with Noir on iOS. The library is written in Swift and is available as a Swift Package.

### Android

As of today, the generation of proofs with Noir on Android is not operational. Support for it will be added soon.

## Setup

If you are unfamiliar with React Native, you can follow the [official guide](https://reactnative.dev/docs/environment-setup) to set up your environment.

For the rest follow the steps below:

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `cd ios && pod install` to install the pods for the iOS project
4. Open the project in Xcode
5. Make sure you see the `Swoir`, `SwoirCore` and `Swoirenberg` libraries in the `Package Dependencies` (if not please open an issue)
6. Make sur you have a valid provisioning profile set up for the app in `Signing & Capabilities`
7. Build & Run the app on your device

## How to replace the circuit

This app comes with a basic Noir circuit checking that the prover knows two private inputs `a` and `b` such that the public input `result` is equal to their product `a * b`. You can replace this circuit with your own by following these steps:

1. Go into the `circuit` folder then `src`
2. Edit the code of `main.nr` to your liking
3. Don't forget to change the `Prover.toml` and `Verifier.toml` files to match the new circuit
4. Make sure you have the version 0.19.4 of `nargo`. You can check by running `nargo --version`. If you have a different version, you can use `noirup -v 0.19.4`. And if you don't have `noirup` follow the instructions [here](https://noir-lang.org/docs/getting_started/installation/).
5. Run `nargo compile` to compile the circuit
6. Copy the content of the newly generated `/target/circuit.json` into the `circuit.json` file present in the `ios` folder.

Note: if you remove the `circuit.json` file from the `ios` folder and replace it by another one, make sure to add it through Xcode (File > Add Files to "NoirReactNative"), otherwise it won't be included in the bundle resources and the app will fail to load the circuit.

## Note on performance

Bear in mind that mobile phones have a limited amount of available RAM. The circuit used in this app is really simple so the memory usage is not a problem. However, if you plan to use more complex circuits, you should be aware that the memory usage will increase and may go above the available memory on the device causing the proof generation to fail.

## Noir version currently supported

The current version of Noir supported by the app is 0.19.4
