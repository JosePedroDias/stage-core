# CONFIGURATION OPTIONS

by instancing a new stage-core, you can provide an object with options.

    {Number} fps     - number of server frames per second. used only for real-time games.
    {Number} port    - server port to use
    {String} rootDir - root directory from which the expected tree is looked for



# STAGE API (CLIENT)

One has the stage variable exposed on the client-side. This provides the following properties and methods:

`{Object} ._cfg` - the retrieved game configuration

`{Object} ._session` - the retrieved player profile


`syncSession({Function} cb)` - by invoking this method you provide a callback which will be called once to profile synchronization takes place. only after this can the game start.

`send({String} kind, {Object}o)` - this method offers a way for the client to send a message of the given kind to the server. Common kinds are 'play' to submit a game-changing action and 'message' to send a message.

`subscribe({String} kind, {Function} cb)` - by providing stage with a cb, you indicate what to do when a message of the given kind is sent from the server. 




# STAGE API (SERVER)

`send({String} kind, {Object} o, {Object} session)` - 

`broadcast({String} kind, {Object} o)`

`subscribe({String} kind, {Function} cb)`
        


# JUDGE API (SERVER)

#

this._state.frameNr
this._state.

## USABLE METHODS

`{Number} getNumReadyPlayers()`

`{Object[]} getReadyPlayers()`

`{Number} getNumWaitingPlayers()`

`{Object[]} getWaitingPlayers()`



`{Boolean} isRunning()` - use this to check it the game is running or not

`start()` - once called, moves the judge state machine to the running state. This has different meaning for real-time and turn-based games. For real-time games it means that a timer is set to call a frame loop n times per second.
For turn-based games it means that the server will notify each player to send play data in round-robin fashion.

`stop()` - once called, stops the game loop.



## REWRITABLE METHODS

`sortFn` - if provided, this function offers a way for the judge to empose an order to the players. This is probably most useful in turn-based games.



`onPlayerEnter({Object} session)` - this method is called once a player enters the game page. in most games this is in the lobby, not directly to the game.

`onPlayerExit({Object} session)` - this method is called when a player abandons the game (either due to connectivity issues or deliberate user exit). can occur at lobby or play time.

`onPlayerReady({Object} session)` - this method signals that this player has submitted his updated profile and is ready to play.



`init()` - this method is called prior to game start, so the server can prepare its state.



`prePlayerUpdates()` - this method is called prior to a game frame being processed. can be used for many features, such as preparing the game state for player input, simulation etc.

`onPlayerUpdate({Object} session)` - each player is called once per frame. this can process de play data provided by the player, updating its state (i.e. position)

`postPlayerUpdates()` - this method is called after all players are processed. can be used to compute stuff such as collisions / simulation steps. Clients are expected to be thrown a state update broadcast during this stage.



`onMessage({any} message)` - this method is invoked when a client sends a message. It's up to the server to decide it's visibility and meaning (ex: could just broadcast it, send it to its teammates, use it as a means to change something else)

`onPlay({any} play)` - this method is invoked when a client has data to provide that is expected to change the course of the game. This can be as low-level as a set of game key states/mouse input, etc, commands such as positions, actions etc or any other combination. Notice that its up to the server to validate if the frequency and values given in such messages are valid, i.e., on popular games one may need to through limiting values and throttling conditions on this method so clients can't cheat.



## ADDITIONAL LIBS

### DiscreteMap

This class provides a simple API for dealing with discrete 2D maps.
The constructor supports setting up a w x h empty matrix or feeding back an older one (use toJSON() to serialize a map)
getCell and setCell offer a way of reading/writing cells.
toString() can be useful to debug the map state on the console.

`new DiscreteMap({Number} w, {Number} h, [{Array} data], [{Boolean} wrap])`
`new DiscreteMap({JSON Repr} w)`

`{Number[2]} wrapPosition({Number} x, {Number} y)`

`{any} getCell(x, y)`

`setCell({Number} x, {Number} y, {any} o)`

`{DiscreteMap} clone()`

`{String} toString([{Boolean} spaced])`

