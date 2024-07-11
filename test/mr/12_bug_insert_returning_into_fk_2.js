const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');
const {prepareTestStructure} = require("./common/prepare-test-structure");
const {delay} = require("./common/delay");
const c = config[process.argv[2]];

fb.promises.debug = function () {
    console.log(`[debug]`, ...arguments)
}
/**
 * /Users/marcio/DevLibs/node-firebird2/test/mr/12_bug_insert_returning_into_fk_2.js
 * ██████╗ ██╗   ██╗ ██████╗
 * ██╔══██╗██║   ██║██╔════╝
 * ██████╔╝██║   ██║██║  ███╗
 * ██╔══██╗██║   ██║██║   ██║
 * ██████╔╝╚██████╔╝╚██████╔╝
 * ╚═════╝  ╚═════╝  ╚═════╝
 *
 * This script has the same purpose than
 * /Users/marcio/DevLibs/node-firebird2/test/mr/12_bug_insert_returning_into_fk.js
 *
 * The difference is that I isolated the problem here by using the internal query + cb
 * to make my test.
 *
 * We exepect res3 to be resolved with an FK error
 *
 * No blocks or unhandled errors are expected here.
 * This is not the case with ./12_bug_insert_returning_into_fk_2_returning.js
 * where we use `RETURNING COL` statements and those are leading to unstable behaviour.
 *
 */
prepareTestStructure(c)
    .then(async () => {
        const con = await fb.promises.attach(c);
        const tx = await con.transaction(fb.ISOLATION_READ_COMMITED_READ_ONLY); // <-- start with readonly tx.
        const res = await tx.query('SELECT * FROM XTEST')
        console.log({res})

        const res2 = await new Promise((resolve, reject) => {
            tx._tx.query(`INSERT INTO XTEST(XTL_ID, XTL_VALUE) VALUES (1, 'SUPER TEST')`,[], (err, result) => {
                if (err) {
                    resolve({
                        err,
                        upgrade: err?.message?.includes('attempted update during read-only transaction')
                    })
                }
                resolve({
                    result
                })
            })
        })

        console.log({res2})

        // NOTE: WE exect a primary key conflict here
        const res3 = await new Promise((resolve, reject) => {
            tx._tx.query(`INSERT INTO XTEST(XTL_ID, XTL_VALUE) VALUES (1, 'SUPER TEST')`,[], (err, result) => {
                if (err) {
                    resolve({
                        err,
                        upgrade: err?.message?.includes('attempted update during read-only transaction')
                    })
                }
                resolve({
                    result
                })
            })
        })


        console.log({res3})


        con.detach()
    })
    .catch(logFb)
