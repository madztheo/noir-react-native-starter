//
//  NoirModule.swift
//  NoirReactNative
//
//  Created by Theo Madzou on 21/02/2024.
//

import Foundation
import React
import Swoir
import Swoirenberg

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

@objc(NoirModule)
class NoirModule: NSObject {

  @objc(prove:resolve:reject:)
  func prove(_ inputs: [String: Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let swoir = Swoir(backend: Swoirenberg.self)
    let manifest = Bundle.main.url(forResource: "circuit.json", withExtension: nil)
    do {
      let circuit = try swoir.createCircuit(manifest: manifest!)

      var formattedInputs = [String:Int]()
      for (key, value) in inputs {
        formattedInputs[key] = Int(value as! String)
      }
      let proof = try circuit.prove(formattedInputs)
      let hexProof = proof.proof.hexEncodedString()
      
      print("Proof", hexProof)
      resolve(hexProof)
    } catch {
      print("Error", error)
      reject("PROOF_GENERATION_ERROR", "Error generating the proof", error)
    }
  }
  
}
