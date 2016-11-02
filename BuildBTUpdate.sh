#!/bin/bash
echo -n "Version String: "
read VERSION
nwbuild -v 0.12.3 -p osx32,osx64,win32,win64,linux32,linux64 -o $PWD/build --macIcns $PWD/BTClientApp/assets/images/BrewTrollerUpdateLogo.icns --winIco $PWD/BTClientApp/assets/images/BrewTrollerUpdateLogo.ico $PWD/BTClientApp
ZIPDIR="$PWD/build"
export ZIPDIR
(cd $PWD/build/BrewTroller\ Update/osx32 && zip -9 -r $ZIPDIR/BrewTrollerUpdate-$VERSION-mac32.zip ./BrewTroller\ Update.app)
(cd $PWD/build/BrewTroller\ Update/osx64 && zip -9 -r $ZIPDIR/BrewTrollerUpdate-$VERSION-mac64.zip ./BrewTroller\ Update.app)
(cd $PWD/build/BrewTroller\ Update/win32 && zip -9 -r $ZIPDIR/BrewTrollerUpdate-$VERSION-win32.zip ./*)
(cd $PWD/build/BrewTroller\ Update/win64 && zip -9 -r $ZIPDIR/BrewTrollerUpdate-$VERSION-win64.zip ./*)
(cd $PWD/build/BrewTroller\ Update/linux32 && zip -9 -r $ZIPDIR/BrewTrollerUpdate-$VERSION-linux32.zip ./*)
(cd $PWD/build/BrewTroller\ Update/linux64 && zip -9 -r $ZIPDIR/BrewTrollerUpdate-$VERSION-linux64.zip ./*)  
