#!/usr/bin/env bash

tmp="/tmp"

npm install .
npm run build

rm -rf "$tmp/cell-viz"
cp -r out "$tmp/cell-viz"

git checkout gh-pages

cp -r "$tmp/cell-viz" bin

git add bin

git commit -m "Publishing latest to gh-pages"
git push origin gh-pages

git checkout master