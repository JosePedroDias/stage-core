## What is stage-core?

Stage provides a **simple way of creating web-based multiplayer games**.
It exposes an ***HTTP server** for serving a **simple-page games** with **websocket communication** and a **built-in state machine** to take care of the most common features of both **real-time** and **turn-based games**, for both **human players** and **bots**.

Stage does not impose any library for input or rendering. It offers some merely as suggestions of implementation.
Given the game configuration, where you set up the kind of game (real-time or turn-based) and other technical aspects (i.e. turn fps/bot fps), you get a set of methods, some of which you can override to set your game logic in these key stages.
We mention games a lot, but any collaborative/competitive scenario can be aided by stage-core's skeleton functionality.

Here are some of the features you get out of the box:

* **lobby** where users can setup preferences and prepare teams

* **persisted session** for storing player info between games

* **persisted game state** for reusable scenarios (i.e. maps, resources, etc.)

* session and socket associated automatically

* capable of **running bots** in the server as **sandboxed environments**. A bot is a computer agent which receives a view of the world (its **perceptions**, is capable of maintaining an **internal state** and ought to return an **action**)

* pluggable judge logic. the **judge runs on the server and enforces the game logic**. It has **built-in methods** which **can be overwritten** to take care of message filtering, state loading and updating, game start and end conditions, etc.

At the start, the client will attempt to fetch session data stored earlier on such as name, avatar, etc.
If certain rules are to be enforced such as minimum number of players, the judge can wait for the right conditions for the game to start.
Chat functionality is offered out of the box as shout (broadcast). This can be tweaked so only necessary receipients get the message (say, teamsay, etc.)

Both server and client are free to exchange any type of messages between them, but for simplicity sake, we've defined a couple of them which can take you a long way:

* **player-initiated input** (either raw mouse/keyboard data or higher level commands) ought to be sent via the **play** message.

* The **server/judge state is the reference state**.

* On most games the server sends players an **update** message so players can render the environment according to their viewpoint.

* On **real-time games**:

    * **play** messages can occurr eventually anytime or can be throttled, depending on the game.

    * In the server x frames are run per second. For each frame there's:
        * a **pre-frame update**
        * a **per player update** (for every player)
        * a **post-frame update**.

* On **turn-based games**:

    * by default each player is expected to send a **play** message in round-robin fashion.
    * The judge notifies each player when to play (sending a **yourTurn** message) and ignores **play** messages sent out of order.



## App/game structure

Each game is expected to have the following directory structure:

* **client** (this dir ought to have at least an index.html file. styling css, logic js and additional media should sit here. this is the default served content)

* **server** (this dir is expected to have at least judge.js, your implementation of the game logic sitting in the server. additional files can be added too, if necessary) this directory won't be served to the client at all.

* **lib** (here should be reusable stuff, both for the client and server scenarios. js libs useful for many games could be in lib/client, such as threejs, raphael, etc; reusable auxiliary server stuff can be put on lib/server)

    * **server**

    * **client**

* **persistence** (here will sit player and state key-value stores for convenience game persistence)
