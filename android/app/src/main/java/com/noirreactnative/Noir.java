package noir;

import java.util.Map;

public class Noir {
    public static native Proof prove(String circuit_bytecode, Map<String, String> inital_witness, String proof_type, String num_points);

    public static native boolean verify(String circuit_bytecode, Proof proof, String proof_type, String num_points);

    public static native int setup_srs(String circuit_bytecode, String srs_path);
    public static native int setup_srs(String circuit_bytecode);
}
