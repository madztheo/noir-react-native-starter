use jni::objects::{JClass, JObject, JString};
use jni::sys::{jboolean, jobject};
use jni::JNIEnv;
use noir_rs::native_types::{Witness, WitnessMap};
use noir_rs::FieldElement;

#[no_mangle]
pub extern "system" fn Java_noir_Noir_prove<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    circuit_bytecode_jstr: JString<'local>,
    witness_jobject: JObject<'local>,
) -> jobject {
    // Use more descriptive variable names and handle errors gracefully
    let witness_map = match env.get_map(&witness_jobject) {
        Ok(map) => map,
        Err(e) => panic!("Failed to get witness map: {:?}", e),
    };
    let mut witness_iter = witness_map
        .iter(&mut env)
        .expect("Failed to create iterator");

    let circuit_bytecode = env
        .get_string(&circuit_bytecode_jstr)
        .expect("Failed to get string from JString")
        .to_str()
        .expect("Failed to convert Java string to Rust string")
        .to_owned();

    let mut witness_map = WitnessMap::new();

    while let Ok(Some((key, value))) = witness_iter.next(&mut env) {
        let key_str = key.into();
        let value_str = value.into();

        let key_jstr = env.get_string(&key_str).expect("Failed to get key string");
        let value_jstr = env
            .get_string(&value_str)
            .expect("Failed to get value string");

        let key = key_jstr
            .to_str()
            .expect("Failed to convert key to Rust string");
        let value = value_jstr
            .to_str()
            .expect("Failed to convert value to Rust string");

        witness_map.insert(
            Witness(key.parse().expect("Failed to parse key")),
            FieldElement::from_hex(value).expect("Failed to parse value"),
        );
    }

    let (proof, vk) =
        noir_rs::prove(circuit_bytecode, witness_map).expect("Proof generation failed");

    let proof_str = hex::encode(proof);
    let vk_str = hex::encode(vk);

    let proof_jstr = env
        .new_string(proof_str)
        .expect("Failed to create Java string for proof");
    let vk_jstr = env
        .new_string(vk_str)
        .expect("Failed to create Java string for vk");

    let proof_class = env
        .find_class("noir/Proof")
        .expect("Failed to find Proof class");
    env.new_object(
        proof_class,
        "(Ljava/lang/String;Ljava/lang/String;)V",
        &[(&proof_jstr).into(), (&vk_jstr).into()],
    )
    .expect("Failed to create new Proof object")
    .as_raw()
}

#[no_mangle]
pub extern "system" fn Java_noir_Noir_verify<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    circuit_bytecode_jstr: JString<'local>,
    mut proof_jobject: JObject<'local>,
) -> jboolean {
    let circuit_bytecode = env
        .get_string(&circuit_bytecode_jstr)
        .expect("Failed to get string from JString")
        .to_str()
        .expect("Failed to convert Java string to Rust string")
        .to_owned();

    let proof_field = env
        .get_field(&mut proof_jobject, "proof", "Ljava/lang/String;")
        .expect("Failed to get proof field")
        .l()
        .expect("Failed to get proof object");
    let proof_str: JString = proof_field.into();
    let proof_jstr = env
        .get_string(&proof_str)
        .expect("Failed to get string from JString");
    let proof_str = proof_jstr
        .to_str()
        .expect("Failed to convert Java string to Rust string");

    let vk_field = env
        .get_field(&mut proof_jobject, "vk", "Ljava/lang/String;")
        .expect("Failed to get vk field")
        .l()
        .expect("Failed to get vk object");

    let vk_str: JString = vk_field.into();
    let vk_jstr = env
        .get_string(&vk_str)
        .expect("Failed to get string from JString");
    let vk_str = vk_jstr
        .to_str()
        .expect("Failed to convert Java string to Rust string");

    let proof = hex::decode(proof_str).expect("Failed to decode proof");
    let verification_key = hex::decode(vk_str).expect("Failed to decode verification key");

    let verdict =
        noir_rs::verify(circuit_bytecode, proof, verification_key).expect("Verification failed");

    jboolean::from(verdict)
}
