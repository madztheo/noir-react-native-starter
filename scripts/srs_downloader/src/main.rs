use noir_rs::barretenberg::{srs::{get_srs, localsrs::LocalSrs, netsrs::NetSrs, Srs}, utils::get_subgroup_size};
use serde_json::Value;

fn main() {
    // Get the circuit path from the command line
    let circuit_path = std::env::args().nth(1);

    let local_srs: LocalSrs;

    match circuit_path {
        Some(path) => {
            // Read the JSON file into a buffer
            let manifest = std::fs::read(path).expect("Failed to read circuit file");
            // Decode the JSON buffer into a JSON object
            let manifest_value: Value =
                serde_json::from_slice(&manifest).expect("Failed to decode JSON");
            // Get the bytecode from the JSON object
            let bytecode = manifest_value["bytecode"]
                .as_str()
                .expect("Failed to get bytecode");

            println!("Circuit decoded. Downloading SRS...");
            let subgroup_size = get_subgroup_size(bytecode, false);
            let srs: Srs = get_srs(subgroup_size, None);
            local_srs = LocalSrs(srs);
            println!("SRS downloaded.");
        }
        None => {
            println!("No path provided, using default circuit size");
            println!("Downloading SRS...");
            // Default to around 1M constraints, which should be enough
            // for most circuits that can work on a mobile device
            // This translates to a subgroup size of 1048576 (the next power of 2 above 1M, i.e. 2^20)
            let srs: Srs = NetSrs::new(1048576 + 1).to_srs();
            local_srs = LocalSrs(srs);
            println!("SRS downloaded.");
        }
    }

    let save_path = "./scripts/srs.local";
    local_srs.save(Some(&save_path));
    println!("SRS saved to {}", save_path);

    println!("Copying SRS to Android and iOS projects...");
    // Copy the saved file to /android/app/src/main/res/raw/srs.local
    if let Err(e) = std::fs::copy(&save_path, "./android/app/src/main/res/raw/srs.local") {
        eprintln!("Failed to copy SRS to Android project: {}", e);
    } else {
        println!("SRS copied to Android project");
    }

    // Copy the saved file to /ios
    if let Err(e) = std::fs::copy(&save_path, "./ios/srs.local") {
        eprintln!("Failed to copy SRS to iOS project: {}", e);
    } else {
        println!("SRS copied to iOS project. Make sure to add the srs.local file to the Xcode project (Right click on the project -> Add files to project -> Choose the srs.local in ios folder)");
    }

    // Remove the saved file
    std::fs::remove_file(&save_path).expect("Failed to remove saved SRS file");
    println!("Removed temporary artifacts. Done!");
}
