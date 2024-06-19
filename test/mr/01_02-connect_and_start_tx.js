const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');
const {ISOLATION_READ_COMMITED,ISOLATION_READ_COMMITED_READ_ONLY} = require("../../lib");

fb.promises.debug = console.log.bind(console);

let con;
fb.promises.attach(config[process.argv[2]])
    .then(async (_con) => {
        con = _con;
        // console.log(con);
        const t = await con.transaction({
            isolation: ISOLATION_READ_COMMITED,
            // mode: 'write',           <--- mode can also be used but if it does it will overwrite the provided isolation config
            lockTimeout: 10,
            rec: false,
            wait: true,
            upgradable: true
        });

        console.log('------------- (RESTART WITH SAME SETTINGS) -------------')
        await t.restart()
        console.log('------------- (RESTART WITH NEW SETTINGS) -------------')
        await t.restart({mode: 'read', wait: true, rec: false, lockTimeout: 20});
        console.log('------------- (RESTART WITH SAME SETTINGS) -------------')
        await t.restart();
        await t.commit(); // commits and closes the transaction
        console.log(t._tx.isolation);
        // await t.commitRetaining(); // commits but keeps transaction open for further requests.
        await con.detach();
    }).catch((err) => {
        logFb(err)
        con?.detach?.();
    })
