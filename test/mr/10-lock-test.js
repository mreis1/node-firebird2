const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');
const {delay} = require("./common/delay");

fb.promises.debug = console.log.bind(console);

let con1, con2;

Promise.all([
    fb.promises.attach(config[process.argv[2]]),
    fb.promises.attach(config[process.argv[2]])
]).then(async ([_con1, _con2]) => {
    con1 = _con1;
    con2 = _con2;
    const tx1 = await con1.transaction(fb.ISOLATION_READ_COMMITED); // <-- start with readonly tx.
    const tx2 = await con2.transaction(fb.ISOLATION_READ_COMMITED); // <-- start with readonly tx.

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
        // ...commiting tx1 will release the lock
        tx1.commit().then(() => 'Tx1 was commited releasing the lock asset');
    });

    console.log('Querying the cli_id = 2323');
    const results = await tx2.query('SELECT * FROM CLIENTS WHERE CLI_ID=2323'); // and <-- this will resolve
    console.log('Query completed cli_id = 2323', results);

    await con1.detach();
    await con2.detach()

}).catch((err) => {
    logFb(err)
    con1?.detach?.();
    con2?.detach?.();
})

