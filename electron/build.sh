
mkdir -p public
cp -r ../dom/public/* public
../node_modules/.bin/webpack --config ../dom/scripts/webpack.config.js
./node_modules/.bin/electron-packager . --overwrite --platform=darwin --arch=x64 --out=../releases --prune=false
