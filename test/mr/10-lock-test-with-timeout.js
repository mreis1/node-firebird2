const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');
const {delay} = require("./common/delay");

/***
 * Creates a lock on a particular CLIENT
 * Then attempts to query that element with two different transactions
 * tx2 -> a write transaction that specified a lock timeout
 * tx3 -> a read-only transaction with no wait and record_version (allowing to see commits even if commited afterwards)
 *
 */

fb.promises.debug = console.log.bind(console);

let con1, con2, con3;

Promise.all([
    fb.promises.attach(config[process.argv[2]]),
    fb.promises.attach(config[process.argv[2]]),
    fb.promises.attach(config[process.argv[2]])
]).then(async ([_con1, _con2, _con3]) => {
    con1 = _con1;
    con2 = _con2;
    con3 = _con3;
    const tx1 = await con1.transaction(fb.ISOLATION_READ_COMMITED); // <-- start with readonly tx.
    const tx2 = await con2.transaction({
        isolation: fb.ISOLATION_READ_COMMITED,
        lockTimeout: 2
    }); // <-- start with readonly tx.
    const tx3 = await con2.transaction({
        isolation: fb.ISOLATION_READ_COMMITED_READ_ONLY, // <-- optional since this is the default isolation
        // wait: false
    }); // <-- start with readonly tx.

    try {
        // The tx1 query will create a lock on this record for other write transactions
        const query = 'UPDATE CLIENTS SET CLI_NOM=CLI_NOM||\'1\' WHERE CLI_ID=2323';
        // const query = `INSERT INTO XXX_TEST(ID, NAME) VALUES (${Date.now()},\'TEST LABEL\')`;
        const res = await tx1.query(query)
        console.log('Insert completed', res);
    } catch (err) {
        logFb(err)
    }

    delay(15000).then(() => {
        console.log('****** RELEASING LOCK *******')
        // ...commiting tx1 will release the lock
        tx1.commit().then(() => 'Tx1 was commited releasing the lock asset');
    });

    await Promise.all([
        // READ ONLY TX - WONT LOCK
        new Promise(async (resolve, reject) => {
            try {
                console.log('tx2(write wait). Querying the cli_id = 2323');
                const results = await tx2.query('SELECT * FROM CLIENTS WHERE CLI_ID=2323'); // and <-- this will resolve
                console.log('tx2(write wait). resolved', results);
                resolve()
            } catch (err){
                console.log({tx2: {err}});
                resolve({err})
            }
        }),
        // WRITE + WAIT - WILL LOCK
        new Promise(async (resolve, reject) => {
            try {
                console.log('tx3(read only). Querying the cli_id = 2323');
                const results = await tx3.query('SELECT * FROM CLIENTS WHERE CLI_ID=2323'); // and <-- this will resolve
                console.log('tx3(read only). resolved', results);
                resolve()
            } catch (err){
                console.log({tx3: {err}});
                resolve({err})
            }
        }),
    ]).catch(err => logFb(err));
    console.log('******** all resolved')
    await con1.detach();
    await con2.detach()
    await con3.detach()

}).catch((err) => {
    logFb(err)
    con1?.detach?.();
    con2?.detach?.();
    con3?.detach?.();
})


/**
 * marcio@MacBook-Pro-de-Marcio node-firebird2 % node test/mr/10-lock-test-with-timeout.js vm0
 * Tx settings:  [ 3, 9, 6, 15, 18 ]
 * Tx settings:  { isolation: [ 3, 9, 6, 15, 18 ], lockTimeout: 2 }
 * XXX true
 * Registering the timeout
 * Tx settings:  {}
 * Insert completed undefined
 * tx2(write wait). Querying the cli_id = 2323
 * tx3(read only). Querying the cli_id = 2323
 * {
 *   tx2: {
 *     err: Error [GDSError]: deadlock, read conflicts with concurrent update, concurrent transaction number is 13800228
 *         at doCallback (/Users/marcio/DevLibs/node-firebird2/lib/index.js:1507:12)
 *         at /Users/marcio/DevLibs/node-firebird2/lib/index.js:3624:7
 *         at /Users/marcio/DevLibs/node-firebird2/lib/messages.js:169:17
 *         at search (/Users/marcio/DevLibs/node-firebird2/lib/messages.js:151:13)
 *         at readIndex (/Users/marcio/DevLibs/node-firebird2/lib/messages.js:90:17)
 *         at readIndex (/Users/marcio/DevLibs/node-firebird2/lib/messages.js:100:21)
 *         at readIndex (/Users/marcio/DevLibs/node-firebird2/lib/messages.js:100:21)
 *         at lookup (/Users/marcio/DevLibs/node-firebird2/lib/messages.js:154:9)
 *         at loop (/Users/marcio/DevLibs/node-firebird2/lib/messages.js:162:9)
 *         at /Users/marcio/DevLibs/node-firebird2/lib/messages.js:172:17 {
 *       code: 335544336
 *     }
 *   }
 * }
 * tx3(read only). resolved [
 *   {
 *     CLI_ID: 2323,
 *    ....
 *     CLI_PLG_PUSH_INACTIF: 0,
 *     CLI_FIN_TICKET_MAIL_INACTIF: 0,
 *     CLI_FIN_FACTURE_MAIL_INACTIF: 0
 *   }
 * ]
 * ******** all resolved
 */
