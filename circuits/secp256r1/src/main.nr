use dep::std::ecdsa_secp256r1;

fn main(public_key_x: [u8; 32], public_key_y: [u8; 32], signature: [u8; 64], message_hash: [u8; 32]) {
    let valid_signature = ecdsa_secp256r1::verify_signature(public_key_x, public_key_y, signature, message_hash);
    assert(valid_signature);
}

#[test]
fn test_main() {
    let pub_key_x = [
        8, 115, 220, 188, 4, 148, 236, 206,
        160, 168, 66, 167, 49, 172, 127, 40,
        4, 237, 255, 39, 134, 80, 45, 198,
        75, 120, 226, 225, 25, 186, 167, 166
    ];

    let pub_key_y = [
        48, 244, 109, 4, 181, 31, 195,
        252, 151, 68, 109, 62, 232, 223,
        145, 160, 192, 244, 214, 76, 233,
        105, 250, 65, 97, 118, 181, 238,
        149, 188, 97, 227
    ];

    let signature = [
        135, 158, 138, 110, 148, 39, 150, 7, 79, 143, 70,
        22, 225, 192, 232, 217, 48, 173, 57, 165, 91, 74,
        239, 134, 249, 242, 221, 162, 85, 153, 67, 91, 111,
        240, 37, 162, 69, 238, 167, 234, 236, 104, 222, 55,
        111, 236, 54, 58, 132, 9, 115, 16, 60, 28, 253,
        228, 112, 42, 248, 193, 157, 7, 246, 233
    ];

    let message = [
        137, 176, 207, 34, 13, 133, 76, 21, 244,
        143, 220, 18, 201, 230, 9, 192, 75, 133,
        105, 73, 233, 97, 9, 164, 200, 116, 62,
        82, 146, 207, 62, 147
    ];
    main(pub_key_x, pub_key_y, signature, message);
}
