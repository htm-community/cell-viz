#!/usr/bin/env bash

tmp="/tmp"

npm install .
npm run build
git add out
git commit -m "Updating binaries"
git push origin 1.2

rm -rf "$tmp/cell-viz"
mkdir "$tmp/cell-viz"
cp -r out/* "$tmp/cell-viz/."

git checkout gh-pages

ls -l "$tmp/cell-viz"
ls "$tmp"
cp "$tmp/cell-viz/" bin/.

git add bin

git commit -m "Publishing latest to gh-pages"
git push origin gh-pages
git push upstream gh-pages

git checkout 1.2
