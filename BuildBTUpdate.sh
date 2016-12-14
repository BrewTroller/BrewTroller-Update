#!/bin/bash
echo -n "Version String: "
read VERSION
nwbuild -f -p osx64,win32,win64,linux32,linux64 -o ./build --macIcns $PWD/assets/images/BrewTrollerUpdateLogo.icns --winIco $PWD/assets/images/BrewTrollerUpdateLogo.ico ./
ZIPDIR="./"
export ZIPDIR
(cd $PWD/build/BrewTroller\ Update/osx32 && zip -9 -r ./BrewTrollerUpdate-$VERSION-mac32.zip ./BrewTroller\ Update.app)
(cd $PWD/build/BrewTroller\ Update/osx64 && zip -9 -r ./BrewTrollerUpdate-$VERSION-mac64.zip ./BrewTroller\ Update.app)
(cd $PWD/build/BrewTroller\ Update/win32 && zip -9 -r ./BrewTrollerUpdate-$VERSION-win32.zip ./*)
(cd $PWD/build/BrewTroller\ Update/win64 && zip -9 -r ./BrewTrollerUpdate-$VERSION-win64.zip ./*)
(cd $PWD/build/BrewTroller\ Update/linux32 && zip -9 -r ./BrewTrollerUpdate-$VERSION-linux32.zip ./*)
(cd $PWD/build/BrewTroller\ Update/linux64 && zip -9 -r ./BrewTrollerUpdate-$VERSION-linux64.zip ./*)  
