# BrewTroller Update
BrewTroller update is a new Desktop application designed to make updating your BrewTroller's firmware easier than BrewTroller makes brewing beer!

**_Warning_**: This utility is currently in alpha stage, and it likely contains some bugs that may cause the utility to appear drunk.

## Motivation
Since the inception of the BrewTroller project installing or updating the firmware on your board has required the installation of the Arduino IDE, and has generally been geared for people who have some coding experience. This utility aims to make this task less painful than the moment when that keg of your new favorite homebrew kicks.  


## Notes
1. This project makes use of native node module (btflasher) to communicate with your BrewTroller. Currently there are pre-built binaries of the btflasher module available for Mac, Windows, and Linux, for 64bit OSes.
2. In order for your computer to communicate with your BrewTroller you may need to install a driver from FTDI. Most _recent_ operating systems either include this driver, or automatically install it for you.
3. This utility does not actually compile the BrewTroller firmware on your computer! It utilizes a cloud compiler service that we have brewed up, and it is also in pre-alpha stage. Until this utility moves into a release state, the cloud compiler service may not always be available.
4. Use of this utility on Linux requires your user be added to the `dialout` group. This may be accomplished with the command `$ sudo usermod -a -G dialout YOUR_USER_NAME`

## Local Build Environment

Requrements: Node.js version 7.x

1. clone the repo locally
2. `$ git checkout develop` to get the develop branch
3. run `$ npm install`
4. run `$ npm run start` to run a local version
5. run `$ npm run dist` to build for all platforms

## Runtime requirements

### Windows
Currently only Windows 7 and newer is supported by BrewTroller Update, and the following packages are required:

- [MSVC Redistributable 2015](https://www.microsoft.com/en-ca/download/details.aspx?id=48145)

## Running from source
To run from source, run the following commands:

```
$ npm run setup
$ npm start
```

## Building

Currently (due to limitations with electron-builder), only a Mac host machine can cross build for all three platforms. In order to cross build for all three platforms, the following dependancies must be installed on your Mac:

- wine
- mono
- gnu-tar
- graphicsmagick
- xz

To intiate a build for all three systems, run: 

```
$ npm install
$ npm run dist
```

To build for a single OS:

```
$ npm install
$ ./node_modules/.bin/build -m
```

Where the `-m` will build for macOS. To build for Windows or Linux instead, replace the `-m` argument with `-w` or `-l` respectively.