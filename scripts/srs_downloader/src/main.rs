use noir_rs::{
    srs::{Srs, localsrs::LocalSrs, netsrs::NetSrs, get_srs},
    utils::get_subgroup_size
};
use serde_json::{Result, Value};

fn main() {
    // Get the circuit path from the command line
    let circuit_path = std::env::args().nth(1).expect("No circuit path provided");
    // Read the JSON file into a buffer
    let manifest = std::fs::read(circuit_path).expect("Failed to read circuit file");
    // Decode the JSON buffer into a JSON object
    let manifest_value: Value = serde_json::from_slice(&manifest).expect("Failed to decode JSON");
    // Get the bytecode from the JSON object
    let bytecode = manifest_value["bytecode"].as_str().expect("Failed to get bytecode");

    println!("Circuit decoded. Downloading SRS...");
    let srs: Srs = get_srs(bytecode.to_string(), None);
    let local_srs = LocalSrs(srs);
    println!("SRS downloaded.");

    let save_path = "./scripts/srs.local";
    local_srs.save(Some(&save_path));
    println!("SRS saved to {}", save_path);

    println!("Copying SRS to Android and iOS projects...");
    // Copy the saved file to /android/app/src/main/res/raw/srs.local
    std::fs::copy(&save_path, "./android/app/src/main/res/raw/srs.local").expect("Failed to copy SRS to Android project");
    println!("SRS copied to Android project");
    // Copy the saved file to /ios
    std::fs::copy(&save_path, "./ios/srs.local").expect("Failed to copy SRS to iOS project");
    println!("SRS copied to iOS project");
    println!("Make sure to add the srs.local file to the Xcode project (Right click on the project -> Add files to project -> Choose the srs.local in ios folder)");
    
    // Remove the saved file
    std::fs::remove_file(&save_path).expect("Failed to remove saved SRS file");
    println!("Removed temporary artifacts. Done!");
}