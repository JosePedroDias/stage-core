#!/bin/sh

if [ $# -ne 1 ]; then 
    echo 'usage: ./create <name>'
    exit
fi

game=$1

if [ -d "$game" ]; then
    echo 'Game dir exists. Choose another name!';
    exit
fi


#READ INPUT
read -p 'port: ' port
read -p 'fps:  ' fps


#BASE
mkdir $game
 
#SERVER
mkdir $game/server
cp games/.template/server/judge.js $game/server/judge.js

#CLIENT
mkdir $game/client
cp .template/client/* $game/client/

#PERSISTENCE
mkdir $game/persistence


#WRITE CONFIG
echo "var st = require('./stage-core');

new st({
    port:     $port,
    rootDir:  __dirname + '/$game',
    fps:      $fps
});
;" > $game/run_$game.js
