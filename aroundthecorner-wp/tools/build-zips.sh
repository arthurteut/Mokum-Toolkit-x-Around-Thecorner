#!/usr/bin/env bash
# Construiește arhivele instalabile în WordPress: dist/atc-motion.zip și dist/atc-child.zip
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
rm -f dist/atc-motion.zip dist/atc-child.zip
(cd plugins && zip -qr -X ../dist/atc-motion.zip atc-motion -x '*.DS_Store')
(cd themes && zip -qr -X ../dist/atc-child.zip atc-child -x '*.DS_Store')
ls -la dist
