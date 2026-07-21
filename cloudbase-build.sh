#!/bin/sh
set -eu

rm -rf dist
mkdir -p dist
cp index.html admin.html styles.css admin.css editorial.css site-data.js gc-api.js app.js admin.js starter-content.js editorial-seed.js editorial-admin.js editorial-ui.js brand-migration.js cloudbase-config.js dist/
