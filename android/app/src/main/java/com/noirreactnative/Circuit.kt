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
    val type: Type?,
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

class Circuit(public val bytecode: String, public val manifest: CircuitManifest, public var num_points: Int = 0) {

    companion object {
        fun fromJsonManifest(jsonManifest: String): Circuit {
            val manifest: CircuitManifest = Gson().fromJson(jsonManifest, CircuitManifest::class.java)
            return Circuit(manifest.bytecode, manifest)
        }
    }

    fun setupSrs(srs_path: String?) {
        num_points = Noir.setup_srs(bytecode, srs_path)
    }

    fun prove(initialWitness: Map<String, Any>, proofType: String): Proof {
        if (num_points == 0) {
            throw IllegalArgumentException("SRS not set up")
        }
        val witness = generateWitnessMap(initialWitness, manifest.abi.parameters, 0)
        return Noir.prove(bytecode, witness, proofType, num_points.toString())
    }

    fun verify(proof: Proof, proofType: String): Boolean {
        if (num_points == 0) {
            throw IllegalArgumentException("SRS not set up")
        }
        return Noir.verify(bytecode, proof, proofType, num_points.toString())
    }

    private fun flattenMultiDimensionalArray(array: List<Any>): List<Any> {
        val flattenedArray = mutableListOf<Any>()
        for (element in array) {
            if (element is List<*>) {
                flattenedArray.addAll(flattenMultiDimensionalArray(element as List<Any>))
            } else {
                flattenedArray.add(element)
            }
        }
        return flattenedArray
    }

    private fun computeTotalLengthOfArray(parameter_type: Type): Int {
        when(parameter_type.kind) {
            "array" -> {
                return parameter_type.length!!.toInt() * computeTotalLengthOfArray(parameter_type.type!!)
            }
            "field", "integer" -> {
                return 1
            }
            "string" -> {
                return parameter_type.length!!.toInt()
            }
            "struct" -> {
                return parameter_type.fields!!.map { computeTotalLengthOfArray(it.type) }.sum()
            }
        }
        return 0
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
                        witness[index.toString()] = value
                        index++
                    
                    } else {
                        throw IllegalArgumentException("Expected integer for parameter: ${parameter.name}")
                    }
                }
                "array" -> {
                    if (value is List<*>) {
                        // Flatten the multi-dimensional array (if not multi-dimensional, it will return the same array)
                        var flattenedArray = flattenMultiDimensionalArray(value as List<Any>)
                        // Compute the expected length of the array
                        var totalLength = computeTotalLengthOfArray(parameter.type)
                        val array = flattenedArray as List<Any>
                        if (array.size != totalLength) {
                            throw IllegalArgumentException("Expected array of length ${parameter.type.length} for parameter: ${parameter.name}")
                        }
                        for (element in array) {
                            if (element is Double) {
                                witness[index.toString()] = "0x${(element.toLong()).toString(16)}"
                                index++
                            } else if(element is String) {
                                // Check the number is in hexadecimal format
                                if (!element.startsWith("0x")) {
                                    throw IllegalArgumentException("Expected hexadecimal number for parameter: ${parameter.name}")
                                }
                                witness[index.toString()] = element
                                index++
                            
                            } else {
                                throw IllegalArgumentException("Unexpected array type for parameter: ${parameter.name}")
                            }

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
                            throw IllegalArgumentException("Expected string of length ${parameter.type.length} for parameter: ${parameter.name}")
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
