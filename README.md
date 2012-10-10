CONFIGURATION OPTIONS
---------------------

    {Number} fps
    {Number} port
    {String} rootDir



STAGE API (SERVER)
------------------

`send({String} kind, {Object} o, {Socket} socket)`

`broadcast({String} kind, {Object} o)`

`subscribe({String} kind, {Function} cb)`
        



STAGE API (CLIENT)
------------------

`{Object} ._cfg`

`{Object} ._session`



`subscribe({String} kind, {Function} cb)`

`syncSession({Function} cb)`

`send({String} kind, {Object}o)`



JUDGE API
---------

`{Number} getNumberOfSessions()`

`{Object[]} getSessions()`

`{Boolean} isRunning()`

`start()`

`stop()`

-----

`sortFn`



`init()`



`onPlayerEnter({Object} session)`

`onPlayerExit({Object} session)`

`onPlayerReady({Object} session)`



`prePlayerUpdates()`

`onPlayerUpdate({Object} session)`

`postPlayerUpdates()`



`onMessage({any} message)`

`onPlay({any} play)`
