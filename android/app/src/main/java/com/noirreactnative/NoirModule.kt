package com.noirreactnative

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Map
import java.util.HashMap
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.Arguments
import androidx.annotation.NonNull
import android.net.Uri
import com.facebook.react.bridge.Promise
import java.io.IOException

import android.util.Log
import com.google.gson.Gson
import noir.Proof
import noir.Noir

class NoirModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "NoirModule"
    var circuit: Circuit? = null

    init {
      System.loadLibrary("noir_java")
    }

    fun loadCircuit(circuitData: String, promise: Promise): Boolean {
        try {
            circuit = Circuit.fromJsonManifest(circuitData)
            return true
        } catch (e: Exception){
            Log.d("CIRCUIT_LOAD_FAIL", e.toString());
            promise.reject("CIRCUIT_LOAD_FAIL", "Unable to load circuit. Please check the circuit was compiled with the correct version of Noir")
            return false
        }
    }

    @ReactMethod fun preloadCircuit(circuitData: String, promise: Promise) {
        loadCircuit(circuitData, promise)
     }

    @ReactMethod fun prove(inputs: ReadableMap, circuitData: String?, promise: Promise) {
        if (circuit == null) {
            if (circuitData == null) {
                promise.reject("CIRCUIT_DATA_UNDEFINED", "Circuit data is undefined. Please provide the circuit data to generate the proof")
                return;
            }
            var succeeded = loadCircuit(circuitData!!, promise)
            if (succeeded != true) {
                return;
            }
        }
        if (circuit == null) {
            promise.reject("CIRCUIT_NOT_LOADED", "Circuit not loaded. Please load the circuit before verifying the proof")
            return;
        }

        try {
            var gson = Gson()
            var proof: Proof? = circuit?.prove(inputs.toHashMap())

            var result: WritableMap = Arguments.createMap()
            result.putString("proof", proof!!.proof)
            result.putString("vkey", proof!!.vk)
            promise.resolve(result)
        } catch (e: Exception) {
            Log.d("PROOF_GENERATION_ERROR", e.toString())
            promise.reject("PROOF_GENERATION_ERROR", "Unable to generate the proof")
        }
    }

    @ReactMethod fun verify(proof: String, vkey: String, circuitData: String?, promise: Promise) {
        if (circuit == null) {
            if (circuitData == null) {
                promise.reject("CIRCUIT_DATA_UNDEFINED", "Circuit data is undefined. Please provide the circuit data to verify the proof")
                return;
            }
            var succeeded = loadCircuit(circuitData!!, promise)
            if (succeeded != true) {
                return;
            }
        }
        if (circuit == null) {
            promise.reject("CIRCUIT_NOT_LOADED", "Circuit not loaded. Please load the circuit before verifying the proof")
            return;
        }

        try {
            var proof: Proof = Proof(proof, vkey)
            var verified: Boolean? = circuit?.verify(proof)
            var result: WritableMap = Arguments.createMap()
            result.putBoolean("verified", verified!!)
            promise.resolve(result)
        } catch (e: Exception) {
            Log.d("PROOF_VERIFICATION_ERRORf", e.toString())
            promise.reject("PROOF_VERIFICATION_ERROR", "Unable to verify the proof. Check the proof and verification key is formatted correctly")
        }
    }
}