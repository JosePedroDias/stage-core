## What is stage-core?

Stage provides a simple way of creating web-based multiplayer games.
It exposes an http server for your game with websocket communication and a built-in state machine to take care
of the most common features of both real-time and turn-based games.

* lobby state where users can setup preferences and prepare teams
* pluggable judge logic. the judge runs on the server and enforces the game logic. It has built-in methods which can be overwritten to take care of message filtering, state loading and updating, game start and end conditions, etc.

At the start, the client can attempt to fetch profile data stored earlier on such as name, avatar, etc.
If certain rules are to be enforced such as minimum number of players, the judge can wait for the right conditions for the game to start. If useful, people can exchange messages anytime during the game or lobby stages.
Both server and client are free to exchange any type of messages between them, but for simplicity sake, we've defined a couple of them which can take you a long way:

player-initiated input (either raw mouse/keyboard data or higher level commands) ought to be sent via the 'play' message.
The server/judge state is the reference state.
On real-time games plays can occurr eventually anytime or can be rounded/throttled, depending on the game.
There occurr x frames per second on the server, for each frame there's a pre-frame update, a per player update and a post-frame update.
On turn-based bases by default each player is expected to play 1 in round-robin.

On stage we don't impose and library/technology for either drawing/audio playback/etc. We offer some example implementations focused on simplicity but you're free to spawn any combination of libs you like.



## App/game structure

each game is expected to have the following directory structure:

client (this dir ought to have at least an index.html file. styling css, logic js and additional media should sit here. this is the default served content)

server (this dir is expected to have at least judge.js, your implementation of the game logic sitting in the server. additional files can be added too, if necessary)

lib (here should be reusable stuff, both for the client and server scenarios. js libs useful for many games could be in lib/client, such as threejs, raphael, etc; reusable auxiliary server stuff can be put on lib/server)
  server
  client

persistence (here will sit player and state key-value stores for convenience game persistence)