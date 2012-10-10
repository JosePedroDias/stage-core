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



`send({String} kind, {Object}o)`

`subscribe({String} kind, {Function} cb)`

`syncSession({Function} cb)`



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



`prePlayerUpdates()`

`onPlayerUpdate(session)`

`postPlayerUpdates()`



`onPlayerEnter(session)`

`onPlayerExit(session)`

`onPlayerReady(session)`
