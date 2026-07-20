#!/bin/sh
set -eu

rm -rf dist
mkdir -p dist
cp index.html admin.html styles.css admin.css site-data.js gc-api.js app.js admin.js cloudbase-config.js dist/
