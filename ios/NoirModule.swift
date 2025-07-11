//
//  NoirModule.swift
//  NoirReactNative
//
//  Created by Theo Madzou on 21/02/2024.
//

import Foundation
import React
import Swoir
import SwoirCore
import Swoirenberg

// c.f. https://stackoverflow.com/questions/26501276/converting-hex-string-to-nsdata-in-swift
extension String {
    
    /// Create `Data` from hexadecimal string representation
    ///
    /// This creates a `Data` object from hex string. Note, if the string has any spaces or non-hex characters (e.g. starts with '<' and with a '>'), those are ignored and only hex characters are processed.
    ///
    /// - returns: Data represented by this hexadecimal string.
    
    var hexadecimal: Data? {
        var data = Data(capacity: count / 2)
        
        let regex = try! NSRegularExpression(pattern: "[0-9a-f]{1,2}", options: .caseInsensitive)
        regex.enumerateMatches(in: self, range: NSRange(startIndex..., in: self)) { match, _, _ in
            let byteString = (self as NSString).substring(with: match!.range)
            let num = UInt8(byteString, radix: 16)!
            data.append(num)
        }
        
        guard data.count > 0 else { return nil }
        
        return data
    }
    
}

// c.f. https://stackoverflow.com/questions/39075043/how-to-convert-data-to-hex-string-in-swift
extension Data {
    struct HexEncodingOptions: OptionSet {
        let rawValue: Int
        static let upperCase = HexEncodingOptions(rawValue: 1 << 0)
    }

    func hexEncodedString(options: HexEncodingOptions = []) -> String {
        let format = options.contains(.upperCase) ? "%02hhX" : "%02hhx"
        return self.map { String(format: format, $0) }.joined()
    }
}

enum CircuitError: Error {
  case unableToInitiateCircuit
  case undefinedCircuit
}

@objc(NoirModule)
class NoirModule: NSObject {
  var swoir = Swoir(backend: Swoirenberg.self)
  var circuits: [String: Circuit] = [:]
  
  func loadCircuit(circuitData: Data, size: UInt32?) throws -> String {
    do {
      let circuit = try swoir.createCircuit(manifest: circuitData, size: size)
      let id = circuit.manifest.hash.description
      circuits[id] = circuit
      return id
    } catch {
      print("Error", error)
      throw CircuitError.unableToInitiateCircuit
    }
  }

  func getLocalSrsPath() -> String? {
    // The srs file is assumed to be named "srs.local" and located in the ios folder
    // and added to the app bundle (c.f. readme for more info)
    let path = Bundle.main.path(forResource: "srs.local", ofType: nil)
    return path
  }

  @objc(setupCircuit:size:resolve:reject:)
  func setupCircuit(_ circuitData: String, size: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Run circuit setup in background thread
    DispatchQueue.global(qos: .userInitiated).async {
      autoreleasepool {
        do {
          let circuitId = try self.loadCircuit(circuitData: circuitData.data(using: .utf8)!, size: UInt32(size))
          guard let circuit = self.circuits[circuitId] else {
            DispatchQueue.main.async {
              reject("CIRCUIT_SETUP_ERROR", "Failed to load circuit", CircuitError.undefinedCircuit)
            }
            return
          }
          
          // Get local srs path
          //let localSrs = self.getLocalSrsPath()
          
          // Setup SRS in background
          try circuit.setupSrs()
          
          DispatchQueue.main.async {
            resolve(["circuitId": circuitId])
          }
        } catch {
          print("Error", error)
          DispatchQueue.main.async {
            reject("CIRCUIT_SETUP_ERROR", "Error setting up the circuit", error)
          }
        }
      }
    }
  }
 
  @objc(prove:circuitId:resolve:reject:)
  func prove(_ inputs: [String: Any], circuitId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Capture circuit reference on main thread before dispatching
    guard let circuit = circuits[circuitId] else {
      reject("PROOF_GENERATION_ERROR", "Circuit not found", CircuitError.undefinedCircuit)
      return
    }
    
    // Run the heavy computation in a high priority background thread
    DispatchQueue.global(qos: .userInitiated).async {
      // Create a new autorelease pool for better memory management during heavy computation
      autoreleasepool {
        do {
          let start = DispatchTime.now()
          
          // Run proof generation in background
          let proof = try circuit.prove(inputs)
          
          let end = DispatchTime.now()
          let nanoTime = end.uptimeNanoseconds - start.uptimeNanoseconds
          let timeInterval = Double(nanoTime) / 1_000_000
          print("Proof generation time: \(timeInterval) ms")

          // Process results in background
          let hexProof = proof.hexEncodedString()
          
          // Switch back to main thread only for the final callback
          DispatchQueue.main.async {
            resolve(["proof": hexProof])
          }
        } catch {
          print("Error", error)
          DispatchQueue.main.async {
            reject("PROOF_GENERATION_ERROR", "Error generating the proof", error)
          }
        }
      }
    }
  }
  
  @objc(verify:circuitId:resolve:reject:)
  func verify(_ proof: String, circuitId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Capture circuit reference on main thread before dispatching
    guard let circuit = circuits[circuitId] else {
      reject("PROOF_VERIFICATION_ERROR", "Circuit not found", CircuitError.undefinedCircuit)
      return
    }

    // Run verification in background thread
    DispatchQueue.global(qos: .userInitiated).async {
      autoreleasepool {
        do {
          guard let proofData = proof.hexadecimal else {
            DispatchQueue.main.async {
              reject("PROOF_VERIFICATION_ERROR", "Invalid proof format", nil)
            }
            return
          }
          
          let verified = try circuit.verify(proofData)
          
          DispatchQueue.main.async {
            resolve(["verified": verified])
          }
        } catch {
          print("Error", error)
          DispatchQueue.main.async {
            reject("PROOF_VERIFICATION_ERROR", "Error verifying the proof", error)
          }
        }
      }
    }
  }

  @objc(execute:circuitId:resolve:reject:)
  func execute(_ inputs: [String: Any], circuitId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let circuit = circuits[circuitId] else {
      reject("CIRCUIT_EXECUTION_ERROR", "Circuit not found", CircuitError.undefinedCircuit)
      return
    }

    DispatchQueue.global(qos: .userInitiated).async {
      autoreleasepool {
        do {
          let witness = try circuit.execute(inputs)
          DispatchQueue.main.async {
            resolve(["witness": witness])
          }
        } catch {
          print("Error", error)
          DispatchQueue.main.async {
            reject("CIRCUIT_EXECUTION_ERROR", "Error executing the circuit", error)
          }
        }
      }
    }
  }

  @objc(clearCircuit:resolve:reject:)
  func clearCircuit(_ circuitId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    circuits.removeValue(forKey: circuitId)
    resolve(["success": true])
  }

  @objc(clearAllCircuits:reject:)
  func clearAllCircuits(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    circuits.removeAll()
    resolve(["success": true])
  }
}
