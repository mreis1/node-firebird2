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

        // started a tx for a given connection
        const tx = await con.transaction(fb.ISOLATION_READ_COMMITED); // <-- start with readonly tx.
        const res = await tx.query('SELECT * FROM XTEST')
        console.log({res})
        const res2 = await tx.query(`INSERT INTO XTEST(XTL_ID, XTL_VALUE) VALUES (1, 'SUPER TEST') RETURNING XTL_ID`);
        console.log({res2});

        try {
            console.log('Running this line will trigger a transaction start at connection.');
            const res3 = await con.query(`INSERT INTO XTEST2(XTL2_ID, XTL2_IDXTL) VALUES (1, 1) RETURNING XTL2_ID`);
            console.log({res3});
        } catch (err) {
            console.log('res3: Failed with error:');
            logFb(err)
        }


        try {
            console.log('After this line, query will never resolve...');
            const res4 = await con.query(`INSERT INTO XTEST2(XTL2_ID, XTL2_IDXTL) VALUES (1, 1) RETURNING XTL2_ID`);
            console.log({res4});
            /**
             *
             * TypeError: Cannot read properties of undefined (reading 'length')
             *     at describe (/Users/marcio/DevLibs/node-firebird2/lib/index.js:4193:28)
             *     at /Users/marcio/DevLibs/node-firebird2/lib/index.js:4353:4
             *     at doCallback (/Users/marcio/DevLibs/node-firebird2/lib/index.js:1509:2)
             *     at /Users/marcio/DevLibs/node-firebird2/lib/index.js:3626:6
             *     at decodeResponse (/Users/marcio/DevLibs/node-firebird2/lib/index.js:3675:15)
             *     at Socket.<anonymous> (/Users/marcio/DevLibs/node-firebird2/lib/index.js:3601:4)
             *     at Socket.emit (node:events:513:28)
             *     at addChunk (node:internal/streams/readable:315:12)
             *     at readableAddChunk (node:internal/streams/readable:289:9)
             *     at Socket.Readable.push (node:internal/streams/readable:228:10)
             *
             *  As a temporary workaround
             *
             */
        } catch (err) {
            logFb(err)
        }


        con.detach()
    })
    .catch(logFb)
