const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');
const {prepareTestStructure} = require("./common/prepare-test-structure");
const {delay} = require("./common/delay");
const c = config[process.argv[2]];

fb.promises.debug = function () {
    console.log(`[debug]`, ...arguments)
}
prepareTestStructure(c)
    .then(async () => {
        const con = await fb.promises.attach(c);
        const tx = await con.transaction(fb.ISOLATION_READ_COMMITED_READ_ONLY); // <-- start with readonly tx.
        const res = await tx.query('SELECT * FROM XTEST')
        console.log({res})

        const res2 = await new Promise((resolve) => {
            tx._tx.query(`INSERT INTO XTEST(XTL_ID, XTL_VALUE) VALUES (1, 'SUPER TEST') RETURNING XTL_ID`, [], (err, result) => {
                resolve({
                    err,
                    upgrade: err?.message?.includes('attempted update during read-only transaction'),
                    result
                })
            })
        })

        console.log({res2})

        const res3 = await new Promise((resolve) => {
            tx._tx.query(`INSERT INTO XTEST(XTL_ID, XTL_VALUE) VALUES (1, 'SUPER TEST') RETURNING XTL_ID`,[], (err, result) => {
                resolve({
                    err,
                    upgrade: err?.message?.includes('attempted update during read-only transaction'),
                    result
                })
            })
        })

        console.log({res3})

        con.detach()
    })
    .catch(logFb)
