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
import android.content.Context
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream

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


    /**
     * Write a raw resource to a file in the app's internal storage
     * We need to do that since noir_rs expects a path to the srs file
     * and we can't get a path to a resource
     * @param resourceId The resource id of the file to write to storage
     * @param fileName The name of the file to write to storage
     */
    fun writeRawResourceToFile(resourceId: Int, fileName: String): String {
        val inputStream = reactApplicationContext.resources.openRawResource(resourceId)
        val file = File(reactApplicationContext.filesDir, fileName)
        val fileOutputStream = FileOutputStream(file)

        try {
            val buffer = ByteArray(1024)
            var length: Int
  
            while (inputStream.read(buffer).also { length = it } != -1) {
                fileOutputStream.write(buffer, 0, length)
            }
  
            return file.absolutePath
        } finally {
            fileOutputStream.close()
            inputStream.close()
        }
    }
    
    fun getLocalSrsPath(): String? {
        val resId = reactApplicationContext.resources.getIdentifier("srs", "raw", reactApplicationContext.packageName)
        // Check the resource file exists
        if (resId == 0) {
            Log.d("SRS_FILE_NOT_FOUND", "srs.dat file not found in /app/src/main/res/raw, reverting to online SRS")
            return null
        }
        // We assume the file is located in /app/src/main/res/raw and is
        // named srs.dat
        val srsFile = File(reactApplicationContext.filesDir, "srs")
        // Check if the srs file is already in the app's internal storage
        if (srsFile.exists()) {
            val srsSize = srsFile.length()
            Log.d("SRS_FILE_SIZE", "srs.dat found in internal storage is " + srsSize.toString() + " bytes")
            // If the file is the right size then we can use it
            if (srsSize == 322560412.toLong()) {
                Log.d("SRS_FILE_VALID", "Valid srs.dat file found in internal storage")
                return srsFile.absolutePath
            }
            Log.d("SRS_FILE_CORRUPTED", "srs.dat file found in internal storage but is corrupted")
            // If not the right size then it's probably corrupted
            // so delete it and write it on internal storage again
            srsFile.delete()
        }
        val srsPath = writeRawResourceToFile(resId, "srs")
        Log.d("SRS_FILE_WRITTEN", "srs.dat file written to internal storage")
        return srsPath
    }

    @ReactMethod fun prepareSrs(promise: Promise) {
        Thread {
            val srsPath = getLocalSrsPath()
            
            var result = Arguments.createMap()
            result.putBoolean("success", true)
            promise.resolve(result)
        }.start()
    }

    @ReactMethod fun preloadCircuit(circuitData: String, runInBackground: Boolean?, promise: Promise) {
        if (runInBackground == true) {
            Thread {
                var succeeded = loadCircuit(circuitData, promise)
                if (succeeded) {
                    var result: WritableMap = Arguments.createMap()
                    result.putBoolean("success", succeeded)
                    promise.resolve(result)
                }
            }.start()
        } else {
            var succeeded = loadCircuit(circuitData, promise)
            if (succeeded) {
                var result: WritableMap = Arguments.createMap()
                result.putBoolean("success", succeeded)
                promise.resolve(result)
            }
        }
     }

    @ReactMethod fun prove(inputs: ReadableMap, circuitData: String?, proofType: String?, promise: Promise) {
        Thread {
            if (circuitData != null) {
                var succeeded = loadCircuit(circuitData!!, promise)
                if (succeeded != true) {
                    promise.reject("CIRCUIT_LOAD_FAIL", "Unable to load circuit. Please check the circuit was compiled with the correct version of Noir")
                    return@Thread
                }
            }
            if (circuit == null) {
                promise.reject("CIRCUIT_NOT_LOADED", "Circuit not loaded. Please load the circuit before verifying the proof")
                return@Thread
            }

            try {
                val localSrs = getLocalSrsPath()

                var proof: Proof? = circuit?.prove(inputs.toHashMap(), proofType ?: "plonk", localSrs)

                var result: WritableMap = Arguments.createMap()
                result.putString("proof", proof!!.proof)
                result.putString("vkey", proof!!.vk)
                promise.resolve(result)
            } catch (e: Exception) {
                Log.d("PROOF_GENERATION_ERROR", e.toString())
                promise.reject("PROOF_GENERATION_ERROR", "Unable to generate the proof")
            }
        }.start()
    }

    @ReactMethod fun verify(proof: String, vkey: String, circuitData: String?, proofType: String?, promise: Promise) {
        Thread {
            if (circuitData != null) {
                var succeeded = loadCircuit(circuitData!!, promise)
                if (succeeded != true) {
                    if (succeeded != true) {
                        promise.reject("CIRCUIT_LOAD_FAIL", "Unable to load circuit. Please check the circuit was compiled with the correct version of Noir")
                        return@Thread
                    }
                    return@Thread
                }
            }
            if (circuit == null) {
                promise.reject("CIRCUIT_NOT_LOADED", "Circuit not loaded. Please load the circuit before verifying the proof")
                return@Thread
            }

            try {
                val localSrs = getLocalSrsPath()

                var proof: Proof = Proof(proof, vkey)
                var verified: Boolean? = circuit?.verify(proof, proofType ?: "plonk", localSrs)

                var result: WritableMap = Arguments.createMap()
                result.putBoolean("verified", verified!!)
                promise.resolve(result)
            } catch (e: Exception) {
                Log.d("PROOF_VERIFICATION_ERRORf", e.toString())
                promise.reject("PROOF_VERIFICATION_ERROR", "Unable to verify the proof. Check the proof and verification key is formatted correctly")
            }
        }.start()
    }
}