# Check that $ANDROID_HOME, $NDK_VERSION and $HOST_TAG are set
if [ -z "$ANDROID_HOME" ]; then
  echo "ANDROID_HOME is not set (e.g. /Users/<username>/Library/Android/sdk)" >&2
  exit 1
fi
if [ -z "$NDK_VERSION" ]; then
  echo "NDK_VERSION is not set (e.g. 26.3.11579264)" >&2
  exit 1
fi
if [ -z "$HOST_TAG" ]; then
  echo "HOST_TAG is not set (e.g. darwin-x86_64)" >&2
  exit 1
fi

export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/$NDK_VERSION

export TOOLCHAIN=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/$HOST_TAG
export TARGET=aarch64-linux-android
export API=33

export AR=$TOOLCHAIN/bin/llvm-ar
export CC=$TOOLCHAIN/bin/$TARGET$API-clang
export AS=$CC
export CXX=$TOOLCHAIN/bin/$TARGET$API-clang++
export LD=$TOOLCHAIN/bin/ld
export RANLIB=$TOOLCHAIN/bin/llvm-ranlib
export STRIP=$TOOLCHAIN/bin/llvm-strip

export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$TOOLCHAIN/bin
export CMAKE_TOOLCHAIN_FILE_aarch64_linux_android=$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake
export ANDROID_ABI=arm64-v8a