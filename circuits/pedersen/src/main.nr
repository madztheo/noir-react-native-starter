use dep::std::hash::pedersen_hash;

fn main(a: Field, b: Field) {
    for i in 0..500 {
        assert(
            pedersen_hash([a + i as Field, b + i as Field])
                == pedersen_hash([a + i as Field, b + i as Field]),
        );
    }
}
