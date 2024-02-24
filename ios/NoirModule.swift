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
  var circuit: Circuit? = nil
  
  func loadCircuit(circuitData: Data) throws {
    do {
      circuit = try swoir.createCircuit(manifest: circuitData)
      if circuit == nil {
        throw CircuitError.unableToInitiateCircuit
      }
    } catch {
      print("Error", error)
      throw CircuitError.unableToInitiateCircuit
    }
  }
  
  @objc(preloadCircuit:resolve:reject:)
  func preloadCircuit(_ circuitData: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      try loadCircuit(circuitData: circuitData.data(using: .utf8)!)
      resolve(["success": true])
    } catch {
      reject("CIRCUIT_LOADING_ERROR", "An error occurred while loading the circuit", error)
    }
  }
 
  @objc(prove:circuitData:resolve:reject:)
  func prove(_ inputs: [String: Any], circuitData: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      if circuitData != nil {
        try loadCircuit(circuitData: circuitData!.data(using: .utf8)!)
      }
      if circuit == nil {
        throw CircuitError.undefinedCircuit
      }
      
      let proof = try circuit!.prove(inputs)
      let hexProof = proof.proof.hexEncodedString()
      let hexVkey = proof.vkey.hexEncodedString()
      
      resolve(["proof": hexProof, "vkey": hexVkey])
    } catch {
      print("Error", error)
      reject("PROOF_GENERATION_ERROR", "Error generating the proof", error)
    }
  }
  
  @objc(verify:vkey:circuitData:resolve:reject:)
  func verify(_ proof: String, vkey: String, circuitData: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      if circuitData != nil {
        try loadCircuit(circuitData: circuitData!.data(using: .utf8)!)
      }
      if circuit == nil {
        throw CircuitError.undefinedCircuit
      }
      
      let wholeProof = Proof(proof: proof.hexadecimal!, vkey: vkey.hexadecimal!)
      let verified = try circuit!.verify(wholeProof)
      
      resolve(["verified": verified])
    } catch {
      print("Error", error)
      reject("PROOF_VERIFICATION_ERROR", "Error verifying the proof", error)
    }
  }
}
