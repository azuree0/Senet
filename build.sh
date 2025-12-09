#!/bin/bash
# Build script for Senet WebAssembly

echo "Building Senet WebAssembly module..."
wasm-pack build --target web

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "To run the game, start a local web server:"
    echo "  python -m http.server 8000"
    echo "  or"
    echo "  npx serve"
    echo ""
    echo "Then open http://localhost:8000 in your browser"
else
    echo "Build failed!"
    exit 1
fi

