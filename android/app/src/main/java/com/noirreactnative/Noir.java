package noir;

import java.util.Map;

public class Noir {
    public static native Proof prove(String circuit_bytecode, Map<String, String> inital_witness);

    public static native boolean verify(String circuit_bytecode, Proof proof);
}
