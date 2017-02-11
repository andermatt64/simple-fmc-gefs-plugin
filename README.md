# Simple Flight Management Computer Plugin for GEFS Online
This is a simple flight management computer-esque display that commandeers the existing autopilot UI. This features the ability to follow reasonably complex routes with support for resolving the GPS location for most airports, most US based reporting points/VOR names, and "rough GPS" coordinations (e.g. `XXXXN/YYYYYW`). There are a few bugs with the route UI, but none that _really_ affect game play.
## Development Environment
 1. `npm install -g grunt-cli`
 2. To set up the development environment, make sure [node.js](https://nodejs.org) is installed with [npm](https://www.npmjs.com/).
 3. Run `npm install` to install all the dependencies.
 4. To build, run `grunt`.

## Installing Simple FMC Plugin
 1. Install the [TamperMonkey](https://tampermonkey.net/) browser extension.
 2. Accept and install the Simple FMC plugin user script at [https://raw.githubusercontent.com/andermatt64/simple-fmc-gefs-plugin/master/dist/simple-fmc-gefs-plugin.min.user.js](https://raw.githubusercontent.com/andermatt64/simple-fmc-gefs-plugin/master/dist/simple-fmc-gefs-plugin.min.user.js)
