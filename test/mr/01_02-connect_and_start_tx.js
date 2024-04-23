const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');
const {ISOLATION_READ_COMMITED} = require("../../lib");

fb.promises.debug = console.log.bind(console);

let con;
fb.promises.attach(config[process.argv[2]])
    .then(async (_con) => {
        con = _con;
        // console.log(con);
        const t = await con.transaction({
            isolation: ISOLATION_READ_COMMITED,
            lockTimeout: 10,
            rec: false,
            wait: true,
            upgradable: true
        });
        await t.commit(); // commits and closes the transaction
        // await t.commitRetaining(); // commits but keeps transaction open for further requests.
        await con.detach();
    }).catch((err) => {
        logFb(err)
        con?.detach?.();
    })
