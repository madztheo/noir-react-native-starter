# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Detect if Rust is installed
if ! command -v cargo &> /dev/null
then
    echo "Rust is not installed. Please install Rust to use this script."
    # Ask user if they want to install Rust
    read -p "Do you want to install Rust? (y/n) " -n 1 -r
    # Install Rust if user agrees
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
        source $HOME/.cargo/env
    else
        exit 1
    fi
fi

cargo run --manifest-path $DIR/srs_downloader/Cargo.toml -- $@