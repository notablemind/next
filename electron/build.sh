
set -ex
mkdir -p public
cp -r ../dom/public/* public
(cd src/plugins/quick-add && NODE_ENV=production npm run build)
# cp ../assets/icon_*.png ./
ELECTRON=1 NODE_ENV=production ../node_modules/.bin/webpack --config ../dom/scripts/webpack.config.js
./node_modules/.bin/electron-packager . --icon=../assets/Icon.icns --overwrite --platform=darwin --arch=x64 --out=../releases --prune=false
