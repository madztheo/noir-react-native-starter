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
    val visibility: String?
)

data class Type(
    // struct, array, field, integer, string
    val kind: String,
    val path: String?,
    val fields: List<Parameter>?,
    val length: Double?,
    val sign: String?,
    val width: Double?,
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
        val witness = generateWitnessMap(initialWitness, manifest.abi.parameters, 0)
        Log.d("WITNESS", witness.toString())
        return Noir.prove(bytecode, witness)
    }

    fun verify(proof: Proof): Boolean {
        return Noir.verify(bytecode, proof)
    }

    private fun generateWitnessMap(initialWitness: Map<String, Any>, parameters: List<Parameter>, startIndex: Long): HashMap<String, String> {
        val witness = HashMap<String, String>()
        var index = startIndex
        for (parameter in parameters) {
            val value = initialWitness[parameter.name]
            if (value == null) {
                throw IllegalArgumentException("Missing parameter: ${parameter.name}")
            }
            when (parameter.type.kind) {
                "field", "integer" -> {
                    if (value is Double) {
                        if (parameter.type.width != null && parameter.type.width > 64) {
                            throw IllegalArgumentException("Unsupported number size for parameter: ${parameter.name}. Use a hexadecimal string instead for large numbers.")
                        }
                        witness[index.toString()] = "0x${(value.toLong()).toString(16)}"
                        index++
                    } 
                    // Useful to represent very large numbers that don't fit in a Double
                    else if (value is String) {
                        // Check the number is in hexadecimal format
                        if (!value.startsWith("0x")) {
                            throw IllegalArgumentException("Expected hexadecimal number for parameter: ${parameter.name}")
                        }
                        Log.d("Hex value", value)
                        witness[index.toString()] = value
                        index++
                    
                    } else {
                        throw IllegalArgumentException("Expected integer for parameter: ${parameter.name}")
                    }
                }
                "array" -> {
                    if (value is List<*>) {
                        val array = value as List<Double>
                        if (array.size != parameter.type.length!!.toInt()) {
                            throw IllegalArgumentException("Expected array of length ${parameter.type.length} for parameter: ${parameter.name}")
                        }
                        for (element in array) {
                            witness[index.toString()] = "0x${(element.toLong()).toString(16)}"
                            index++
                        }
                    } else {
                        throw IllegalArgumentException("Expected array of integers for parameter: ${parameter.name}")
                    }
                }
                "struct" -> {
                    if (value is Map<*, *>) {
                        val struct = value as Map<String, Any>
                        val structWitness = generateWitnessMap(struct, parameter.type.fields!!, index)
                        for ((key, value) in structWitness) {
                            witness[key] = value
                            index++
                        }
                    } else {
                        throw IllegalArgumentException("Expected struct for parameter: ${parameter.name}")
                    }
                }
                "string" -> {
                    if (value is String) {
                        // Transform the string into a byte array
                        val array = value.toByteArray()
                        if (array.size != parameter.type.length!!.toInt()) {
                            throw IllegalArgumentException("Expected array of length ${parameter.type.length} for parameter: ${parameter.name}")
                        }
                        for (element in array) {
                            witness[index.toString()] = "0x${(element.toLong()).toString(16)}"
                            index++
                        }
                    } else {
                        throw IllegalArgumentException("Expected string for parameter: ${parameter.name}")
                    }
                }
                else -> throw IllegalArgumentException("Unsupported parameter type: ${parameter.type}")
            }
        }
        return witness
    }
}
