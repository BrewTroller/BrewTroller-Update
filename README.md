#BrewTroller Update
BrewTroller update is a new Desktop application designed to make updating your BrewTroller's firmware easier than BrewTroller makes brewing beer!

**_Warning_**: This utility is currently in a pre-alpha stage, and it likely contains some bugs that may cause the utility to appear either drunk.

##Motivation
Since the inception of the BrewTroller project installing or updating the firmware on your board has required the installation of the Arduino IDE, and has generally been geared for people who have some coding experience. This utility aims to make this task less painful than the moment when that keg of your new favorite homebrew kicks.  

##Development Requirements
- Node.js
    - npm
    - bower
- Node-webkit
    - nw-builder

##Notes
1. This project uses a Go binary to actually communicate with your BrewTroller board. Currently the compiled binaries for each architecture are included in this repository, until we release the source code for the communication binary.
2. In order for your computer to communicate with your BrewTroller you may need to install a driver from FTDI. Most _recent_ operating systems either include this driver, or automatically install it for you.
3. This utility does not actually compile the BrewTroller firmware on your computer! It utilizes a cloud compiler service that we have brewed up, and it is also in pre-alpha stage. Until this utility moves into a release state, the cloud compiler service may not always be available.
