#!/usr/bin/env bash

# If error code, stop script
set -e
npm config set strict-ssl false
npm install

node build-tasks.js test

LICENSE=`cat LICENSE`
rm -rf dist
mkdir dist
node node_modules/uglify-js/bin/uglifyjs minibars.js \
    -o dist/minibars.min.js \
    --mangle --compress \
    --preamble "/*${LICENSE}*/"

echo "  Output to dist/minibars.min.js"

if [ "$#" -ne 0 ] && [ $1 = "--release" ]
then
    # Increment package json
    node build-tasks.js update-version $2
    VERSION=`node build-tasks.js get-version`

    # Merge to master and publish
    git add package.json
    git commit -am "Released ${VERSION}"
    git tag "${VERSION}" --force
    git push origin HEAD:master --tags

    # Release
    npm publish
fi
