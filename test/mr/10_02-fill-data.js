const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');


let con;
fb.promises.attach(config[process.argv[2]])
    .then(async (_con) => {
        con = _con;
        const tx = await con.transaction(fb.ISOLATION_READ_COMMITED_READ_ONLY); // <-- start with readonly tx.
        try {
            const query = `INSERT INTO XXX_TEST(ID, NAME) VALUES (${Date.now()},\'TEST LABEL\')`;
            const res = await tx.query(query)
            console.log('Insert completed', res);
        } catch (err) {
            logFb(err)
        }
        await tx.commit();
        await con.detach();
        // // const c = await fb.query('SELECT * FROM users WHERE user = ?', ['test'])

    }).catch((err) => {
        logFb(err)
        con.detach();
    })
