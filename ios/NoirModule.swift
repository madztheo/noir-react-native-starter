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
  
  func loadCircuit(circuitData: Data) throws -> String {
    do {
      let circuit = try swoir.createCircuit(manifest: circuitData)
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

  @objc(setupCircuit:recursive:resolve:reject:)
  func setupCircuit(_ circuitData: String, recursive: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      let circuitId = try loadCircuit(circuitData: circuitData.data(using: .utf8)!)

      let circuit = circuits[circuitId]
      
      // Try to get the local srs if any
      // If no local srs file is found, it will be fetched directly
      // online from Aztec servers
      let localSrs = getLocalSrsPath()
      
      try circuit?.setupSrs(srs_path: localSrs, recursive: recursive ?? false)
      
      resolve(["circuitId": circuitId])
    } catch {
      print("Error", error)
      reject("CIRCUIT_SETUP_ERROR", "Error setting up the circuit", error)
    }
  }
 
  @objc(prove:circuitId:proofType:recursive:resolve:reject:)
  func prove(_ inputs: [String: Any], circuitId: String, proofType: String, recursive: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      let circuit = circuits[circuitId]
      if circuit == nil {
        throw CircuitError.undefinedCircuit
      }

      let start = DispatchTime.now()
      let proof = try circuit?.prove(inputs, proof_type: proofType ?? "plonk", recursive: recursive ?? false)
      let end = DispatchTime.now()
      let nanoTime = end.uptimeNanoseconds - start.uptimeNanoseconds
      let timeInterval = Double(nanoTime) / 1_000_000
      print("Proof generation time: \(timeInterval) ms")

      let hexProof = proof?.proof.hexEncodedString()
      let hexVkey = proof?.vkey.hexEncodedString()
      
      resolve(["proof": hexProof, "vkey": hexVkey])
    } catch {
      print("Error", error)
      reject("PROOF_GENERATION_ERROR", "Error generating the proof", error)
    }
  }
  
  @objc(verify:vkey:circuitId:proofType:resolve:reject:)
  func verify(_ proof: String, vkey: String, circuitId: String, proofType: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      let circuit = circuits[circuitId]
      if circuit == nil {
        throw CircuitError.undefinedCircuit
      }
      
      let wholeProof = Proof(proof: proof.hexadecimal!, vkey: vkey.hexadecimal!)
      let verified = try circuit!.verify(wholeProof, proof_type: proofType ?? "plonk")
      
      resolve(["verified": verified])
    } catch {
      print("Error", error)
      reject("PROOF_VERIFICATION_ERROR", "Error verifying the proof", error)
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
