const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');
const {prepareTestStructure} = require("./common/prepare-test-structure");
const {delay} = require("./common/delay");
const c = config[process.argv[2]];

fb.promises.debug = function () {
    console.log(`[debug]`, arguments)
}
prepareTestStructure(c)
    .then(async () => {
        const con = await fb.promises.attach(c);
        const tx = await con.transaction(fb.ISOLATION_READ_COMMITED); // <-- start with readonly tx.
        const res = await tx.query('SELECT * FROM XTEST')
        console.log({res})
        const res2 = await tx.query(`INSERT INTO XTEST(XTL_ID, XTL_VALUE) VALUES (1, 'SUPER TEST') RETURNING XTL_ID`);
        console.log({res2});
        const res3 = await tx.query(`INSERT INTO XTEST2(XTL2_ID, XTL2_IDXTL) VALUES (1, 1) RETURNING XTL2_ID`);
        console.log({res3});
        try {
            const res4 = await tx.query(`INSERT INTO XTEST2(XTL2_ID, XTL2_IDXTL) VALUES (2, 2) RETURNING XTL2_ID`);
            console.log({res4});
        } catch (err) {
            logFb(err)
        }

        // § await delay(0)
        //      Without this line, the statement below would trigger
        //      `❌335544327 invalid request handle`
        // to fix this problem
        // await delay(0)
        try {
            const res4 = await tx.query(`INSERT INTO XTEST2(XTL2_ID, XTL2_IDXTL) VALUES (2, 1) RETURNING XTL2_ID`);
            console.log({res4});
        } catch (err) {
            logFb(err)
        }

        con.detach()
    })
    .catch(logFb)
