## TESTS 

### How to use
node ./test/mr/01-connect.js <config_alias>
node ./test/mr/<file>.js <config_alias> ...other_arguments

### More complex use-cases: 
Refer to this test in which I make use of tx.restart() - [09-create-insert-read-drop.js](09-create-insert-read-drop.js)

-- DB EVENTS
node ./test/mr/11-trigger-event.js <config_alias> <events>
node ./test/mr/11-trigger-event.js vm1 evt1,evt2
