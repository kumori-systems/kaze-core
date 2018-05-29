#!/bin/bash

rm -rf node_modules
npm install
npm run build
git add .
git commit -m 'Adding support for Delta images'
git push origin radiatus