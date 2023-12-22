package com.noirreactnative;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.Map;
import java.util.HashMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import android.net.Uri;
import com.facebook.react.bridge.Promise;
import java.io.IOException;
import android.util.Log;

public class NoirProvingModule extends ReactContextBaseJavaModule {
    public static String CIRCUIT_BYTECODE = "H4sIAAAAAAAA/62PQQ6AIAwEK3yopS20N78iEf7/BGOCkURvOpfd02Q3AsACN1dfR+I36PSFFy9jFmklNWLaMHk1RdGajYzUdE/G3EysePWCTsKNujr3IY7/bcQwfZ+3RnhyAMmFm+wwAQAA";

    static {
        System.loadLibrary("noir_java");
    }

    NoirProvingModule(ReactApplicationContext context) {
       super(context);
   }

   // add to NoirProvingModule.java
    @Override
    public String getName() {
        return "NoirProvingModule";
    }

    @ReactMethod
    public void prove(ReadableMap inputs, Promise promise) {
        //Log.d("Initializing witness...");
        HashMap<String, String> initial_witness = new HashMap<String, String>();
        initial_witness.put("1", Integer.decode(inputs.getString("a")).toString());
        initial_witness.put("2",  Integer.decode(inputs.getString("b")).toString());
        initial_witness.put("3",  Integer.decode(inputs.getString("result")).toString());
        Proof proof = Noir.prove(CIRCUIT_BYTECODE, initial_witness);
        WritableMap map = Arguments.createMap();
        map.putString("proof", proof.proof);
        map.putString("vk", proof.vk);
        promise.resolve(map);
    }

    @ReactMethod
    public void verify(ReadableMap inputs, Promise promise) {
        Proof proof = new Proof(inputs.getString("proof"), inputs.getString("vk"));
        boolean result = Noir.verify(CIRCUIT_BYTECODE, proof);
        promise.resolve(result);
    }
}