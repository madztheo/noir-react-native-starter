package com.noirreactnative

import com.google.gson.Gson
import noir.Noir
import noir.Proof
import android.util.Log

data class CircuitManifest(
    val noir_version: String,
    // All JSON numbers are parsed as Double by Gson
    val hash: Double,
    val abi: Abi,
    val bytecode: String,
    val debug_symbols: String,
    val file_map: Map<String, FileMap>,
    val names: List<String>
)

data class Abi(
    val parameters: List<Parameter>,
    val param_witnesses: Map<String, List<Witness>>,
    val return_type: Any?,
    val return_witnesses: List<Any>,
    val error_types: ErrorTypes
)

data class Parameter(
    val name: String,
    val type: Type,
    val visibility: String
)

data class Type(
    val kind: String
)

data class Witness(
    // All JSON numbers are parsed as Double by Gson
    val start: Double,
    val end: Double
)

data class ErrorTypes(
    val error: Any?
)

data class FileMap(
    val source: String,
    val path: String
)

class Circuit(public val bytecode: String, public val manifest: CircuitManifest) {

    companion object {
        fun fromJsonManifest(jsonManifest: String): Circuit {
            val manifest: CircuitManifest = Gson().fromJson(jsonManifest, CircuitManifest::class.java)
            return Circuit(manifest.bytecode, manifest)
        }
    }

    fun prove(initialWitness: Map<String, Any>): Proof {
        val witness = generateWitnessMap(initialWitness)
        return Noir.prove(bytecode, witness)
    }

    fun verify(proof: Proof): Boolean {
        return Noir.verify(bytecode, proof)
    }

    private fun generateWitnessMap(initialWitness: Map<String, Any>): HashMap<String, String> {
        val witness = HashMap<String, String>()
        var index = 0
        for (parameter in manifest.abi.parameters) {
            val value = initialWitness[parameter.name]
            if (value == null) {
                throw IllegalArgumentException("Missing parameter: ${parameter.name}")
            }
            when (parameter.type.kind) {
                "field", "integer" -> {
                    if (value is Double) {
                        witness[index.toString()] = "0x${(value.toLong()).toString(16)}"
                        index++
                    } else {
                        throw IllegalArgumentException("Expected integer for parameter: ${parameter.name}")
                    }
                }
                "array" -> {
                    if (value is List<*>) {
                        val array = value as List<Double>
                        for (element in array) {
                            witness[index.toString()] = "0x${(element.toLong()).toString(16)}"
                            index++
                        }
                    } else {
                        throw IllegalArgumentException("Expected array of integers for parameter: ${parameter.name}")
                    }
                }
                else -> throw IllegalArgumentException("Unsupported parameter type: ${parameter.type}")
            }
        }
        return witness
    }
}
