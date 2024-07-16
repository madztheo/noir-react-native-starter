curl -o srs.dat https://aztec-ignition.s3.amazonaws.com/MAIN%20IGNITION/monomial/transcript00.dat
echo "Downloaded srs.dat"
cp srs.dat ./android/app/src/main/res/raw/srs.dat
echo "Copied srs.dat to android project"
cp srs.dat ./ios
echo "Copied srs.dat to ios project"
rm srs.dat
echo "Make sure to add the srs.dat file to the Xcode project (Right click on the project -> Add files to project -> Choose the srs.dat in ios folder)"