# Noir React Native starter

## Description

This is a simple React Native app showcasing how to use Noir in a mobile app (both for iOS and Android) to generate and verify proofs directly on mobile phones.

## Mobile proving

### iOS

The app integrates with the [Swoir library](https://github.com/Swoir/Swoir) to generate proofs with Noir on iOS. The library is written in Swift and is available as a Swift Package.

### Android

The app integrates some Kotlin code following a similar logic to Swoir, by taking the same type of inputs and the circuit manifest to generate proofs with Noir on Android. This part of the code will be exported soon in a separate library to simplify reusability.

## General setup

If you are unfamiliar with React Native, you can follow the [official guide](https://reactnative.dev/docs/environment-setup) to set up your environment.

For the rest follow the steps below:

1. Clone the repository
2. Run `npm install` to install the dependencies
3. [Optional] Download the SRS by running `./scripts/download-srs.sh`. It will download it and place a copy in the iOS project and the Android project. Don't forget to make sure the srs.dat file appears on XCode.

## Setup on iOS

1. Run `npx pod-install` to install the pods for the iOS project
2. Open the project in Xcode
3. Make sure you see the `Swoir`, `SwoirCore` and `Swoirenberg` libraries in the `Package Dependencies` (if not please open an issue)
4. Make sure you have a valid provisioning profile set up for the app in `Signing & Capabilities`
5. Build & Run the app on your device

## Setup on Android

1. Make sure to define the environment variables `ANDROID_HOME`, `NDK_VERSION` and `HOST_TAG`, they will help the build process to find Android NDK necessary to compile the native code. Example on MacOS:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export NDK_VERSION=26.3.11579264
export HOST_TAG=darwin-x86_64
```

2. Connect your Android device and check it is connected by running `npm run android-devices`. It should display the connected device as `device` in the list of devices attached.
3. Run `npm run android` to build and run the app on your device

**Note**: If you want to do a clean build, you can run `./scripts/clean-android.sh` before running `npm run android`

## SRS download strategies

The Structured Reference String (or SRS) contains the necessary data from the Universal Trusted Setup of Aztec to generate proofs with Noir (or more precisely the Barretenberg backend). So you will need it in the app.

There are two strategies to include the SRS in the app:

1. **Pre-download the SRS and store it locally**: You can download the SRS into the app binary by running the `./scripts/download-srs.sh` script. It will download the SRS and place it in the iOS and Android projects. If you have many proofs to generate and/or complex circuits with a large number of constraints, this is the recommended approach. It will substantially increase the size of the binary, but the proofs will be generated faster.

2. **Use the SRS from the server**: If you don't download the SRS beforehand when building the app, the app will revert to simply fetching the necessary chunks of the SRS it needs to generate proofs according to the size of the circuit to be executed. This has the advantage of reducing the size of the binary and only downloading the strict minimum of the SRS. However, it will slow down the proof generation process as the app will need to fetch the SRS from the server every time it needs to generate a proof. This is the default strategy used in the app as you have to actively download the SRS if you want to use the first strategy. Also make sure to consider users' data plan and network speed if you use this strategy.

## How to replace the circuit

This app comes with a basic Noir circuit checking that the prover knows two private inputs `a` and `b` such that the public input `result` is equal to their product `a * b`, a circuit verifying a secp256r1 signature and one doing multiple rounds of pedersen hashing. You can replace any of these circuits with your own by following these steps:

1. Go into the `circuits` folder
2. Create a new folder for your circuit such as `my_circuit`
3. Create a `Nargo.toml` file in this folder following the structure of the `Nargo.toml` file in the other subfolders of the `circuits` folder. Don't forget to change the name of the circuit in the `name` field
4. Create a `src` folder and create a `main.nr` file in it
5. Make sure you have the version 0.30.0 of `nargo`. You can check by running `nargo --version`. If you have a different version, you can use `noirup -v 0.30.0`. And if you don't have `noirup` follow the instructions [here](https://noir-lang.org/docs/getting_started/installation/).
6. Write your Noir code in `main.nr` and run `nargo check` to generate the `Prover.toml` and `Verifier.toml` files
7. Run `nargo compile` to compile the circuit
8. It will generate a new `<your_circuit_name>.json` file in `/target`
9. You can then replace the import in the Javascript code to load this circuit instead

## Note on performance

Bear in mind that mobile phones have a limited amount of available RAM. The circuit used in this app is really simple so the memory usage is not a problem. However, if you plan to use more complex circuits, you should be aware that the memory usage will increase and may go above the available memory on the device causing the proof generation to fail.

## A note on Honk

While still a work of progress, Honk APIs are already exposed in Barretenberg and this app gives the ability to tap into it. You can switch between Honk and UltraPlonk (current proofs used by Noir) by specifying the `proofType` of the prove and verify functions. Specify `honk` to use Honk and `plonk` to use UltraPlonk. If not specified, the default is UltraPlonk.

You will notice Honk is substantially faster than UltraPlonk, and uses less memory than UltraPlonk. However, it is still in development and there is no fully working on-chain verifier for it at the moment.

## Noir version currently supported

The current version of Noir supported by the app is 0.30.0
