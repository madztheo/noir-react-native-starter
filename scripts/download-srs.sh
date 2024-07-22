# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cargo run --manifest-path $DIR/srs_downloader/Cargo.toml -- $@