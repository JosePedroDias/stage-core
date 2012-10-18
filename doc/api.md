# Table of Contents

* [Configuration Options (server)](#configuration-options-server)
* [Stage API (server)](#stage-api-server)
* [Judge API (server)](#judge-api-server)
    * [Usable Methods](#usable-methods)
    * [Rewritable Methods](#rewritable-methods)
    * [Rewritable Methods (bots related)](#rewritable-methods-bots-related)
* [Stage API (client)](#stage-api-client)
* [Additional libraries for optional client usage](#additional-libraries-for-optional-client-usage)
    * [stage.lobby](#stagelobby)
    * [stage.console](#stageconsole)
    * [stage.roster](#stageroster)
    * [DiscreteMap](#discretemap)



# Configuration Options (server)

by instancing a new stage-core, you can provide an object with options.

    {Number} port                - server port to use
    {String} rootDir             - root directory from which the expected tree is looked for

    {Number} fps                 - number of server frames per second. used only for real-time games.

    {Number} botsRunEveryNFrames - if ommitted, bots run their logic on every frame. this is expensive and rarely necessary.



# Stage API (server)

`send({String} kind, {Object} o, {Object} session)` - sends the message o of kind kind to the player whose session is session

`broadcast({String} kind, {Object} o)` - broadcasts the message o of kind kind to every player.

`subscribe({String} kind, {Function} cb)` - subscribes messages of kind kind, providing callback cb to be called when they arrive.
        


# Judge API (server)

## Usable Methods

`{Number} getNumReadyPlayers()` - returns the number of players ready/playing

`{Object[]} getReadyPlayers()` - returns an array of ready/playing player sessions

`{Number} getNumWaitingPlayers()` - returns the number of players waiting

`{Object[]} getWaitingPlayers()`- returns an array of waiting player sessions



`{Boolean} isRunning()` - use this to check it the game is running or not

`start()` - once called, moves the judge state machine to the running state. This has different meaning for real-time and turn-based games. For real-time games it means that a timer is set to call a frame loop n times per second.
For turn-based games it means that the server will notify each player to send play data in round-robin fashion via the yourTurn message.

`stop()` - once called, stops the game loop, moving the state maching out of the running state.

`getTime()` - for convenience, provides a human readable representation of the time on the server.



## Rewritable Methods

`sortFn` - if provided, this function offers a way for the judge to empose an order to the players. This is probably most useful in turn-based games.

`{Object} rosterView({Object} o)` - 

`{Object} generateDefaultSession()` - returns a session object for users without prior session stored.



`onPlayerEnter({Object} session)` - this method is called once a player enters the game page. in most games this is in the lobby, not directly to the game.

`onPlayerExit({Object} session)` - this method is called when a player abandons the game (either due to connectivity issues or deliberate user exit). can occur at lobby or play time.

`onPlayerReady({Object} session)` - this method signals that this player has submitted his updated profile and is ready to play.



`init({Boolean} onStart)` - this method is called on 2 ocasions.
If onStart is false, it means it is being called prior to any player connection. Use it to prepare useful structures you'll need ahead of players entering. If onStart is true, it means start() has been called and the game is about to begin.



`prePlayerUpdates()` - this method is called prior to a game frame being processed. can be used for many features, such as preparing the game state for player input, simulation etc.

`onPlayerUpdate({Object} session)` - each player is called once per frame. this can process de play data provided by the player, updating its state (i.e. position)

`postPlayerUpdates()` - this method is called after all players are processed. can be used to compute stuff such as collisions / simulation steps. Clients are expected to be thrown a state update broadcast during this stage.



`onMessage({any} message)` - this method is invoked when a client sends a message. It's up to the server to decide it's visibility and meaning (ex: could just broadcast it, send it to its teammates, use it as a means to change something else). by default broadcasts the message to every other player.

`onPlay({any} play)` - this method is invoked when a client has data to provide that is expected to change the course of the game. This can be as low-level as a set of game key states/mouse input, etc, commands such as positions, actions etc or any other combination. Notice that its up to the server to validate if the frequency and values given in such messages are valid, i.e., on popular games one may need to validate the given values and/or set throttling conditions on this method so clients can't cheat.



## Rewritable Methods (bots related)

For a player to be considered a bot, the `code` key must be present.
If so, `isBot` is set to true and bots get their code run in a context where only `per`, `stt` and `act` are defined (perceptions, internal state and action). In order for the bot to get a meaningful view of the world, you should override judge's `updatePerceptions()` method.

`updatePerceptions({Object} perceptions, {Object} session, {Object} state)`


# Stage API (client)

One has the stage variable exposed on the client-side. This provides the following properties and methods:

`{Object} ._cfg` - the retrieved game configuration

`{Object} ._session` - the retrieved player session (its subset the server wanted to share with the client)

`init({Function({Object} session, {Object} cfg)} onSessionAvailableCb)` - sets up connectivity with the server and returns a prior session (if found) or a default one (if not).

`logIn({Object} session, {Function()}onGameStartedCb)` - call this to send the updated session info. the callback with be called once to game is ready.

`send({String} kind, {any} o)` - this method offers a way for the client to send a message of the given kind to the server. Common kinds are 'play' to submit a game-changing action and 'message' to send a message.

`subscribe({String} kind, {Function} cb)` - by providing stage with a callback, you indicate what to do when a message of the given kind is received from the server. 



# Additional libraries for optional client usage

## stage.lobby

this offers a form which gets displayed when the user connects, offering a form for configuring the player session details such as name, color, avatar, etc.

`generateForm({Object[]} formFields, {Function} onGameStarting)`

a form field can have the following attributes:

* name  - the name of the field (key that will be sent back to the server)
* value - default value. '' if ommitted.
* kind  - the kind changes how the field is presented to the user. for now only 'text' and 'textarea' are supported.
* label - the displayed label, of name if ommitted.

`destroy()` - removes the lobby



## stage.console

`show()` - shows the console

`hide()` - hides the console

`toggle()` - either shows/hides the console, depending on current state

`writeLine({String} txt)` - writes a line on the console

`destroy()` - removes the console



## stage.roster

`show()` - shows the roster

`hide()` - hides the roster

`toggle()` - either shows/hides the roster, depending on current state

`destroy()` - removes the roster



## DiscreteMap

This class provides a simple API for dealing with discrete 2D maps.

The constructor supports setting up a w x h empty matrix or feeding back an older one (use `toJSON()` to serialize a map).

`getCell()` and `setCell()` offer a way of reading/writing cells.

`toString()` can be useful to debug the map state on the console.

`new DiscreteMap({Number} w, {Number} h, [{Array} data], [{Boolean} wrap])`

`new DiscreteMap({JSON Repr} w)`

`{Number[2]} wrapPosition({Number} x, {Number} y)`

`{any} getCell(x, y)`

`setCell({Number} x, {Number} y, {any} o)`

`{DiscreteMap} clone()`

`{String} toString([{Boolean} spaced])`
