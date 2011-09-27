# Rock Paper Scissors Lizard Spock

This is a pure javascript/node.js implementation of the game. The purpose was to use this code in a workshop so the code is partitioned in steps. Each step have 2 branches: an initial one (ex. play) and a final one (ex. play-done)

* __walking-skeleton__: the initial environment and basic project automation
* __play__: basic game mechanics implemented with a simple protocol over HTTP
* __bot__: when no humas are around a bot should play with you
* __socket.io__: each board has a channel where all board's event are published so a client could avoid board's status polling
* __score__: basic score for players and a leaderboard using redis
* __simulation__: how do you know it's working if no one is __really__ playing with it?
* __ui__: basic game interface as a single HTML application, this is the last branch and so the complete application

## INSTALL/DEPENDENCIES

* node >= 0.4.10 is required (http://nodejs.org/)
* redis >= 2.2.12 is required (http://redis.io)
* npm is required (https://github.com/isaacs/npm)
* jake is required (npm install -g jake)
* jshint is required (npm install -g jshint)

## USAGE

* __jake clean__: clean all the artifacts created in ./.work directory
* __jake start__: start all services (dropit server and redis server)
* __jake stop__: stop all services (dropit server and redis server)
* __jake spec__: run all specs
* __jake simulation__: run a bunch of simulated games with a few of simulated players (see Jakefile to change games/players number)
