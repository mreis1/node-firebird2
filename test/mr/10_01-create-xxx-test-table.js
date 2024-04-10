const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');


let con;
fb.promises.attach(config[process.argv[2]])
    .then(async (_con) => {
        con = _con;
        const tx = await con.transaction(fb.ISOLATION_READ_COMMITED_READ_ONLY); // <-- start with readonly tx.

        try {
            await tx.query(`EXECUTE BLOCK AS BEGIN
EXECUTE STATEMENT 'CREATE TABLE XXX_TEST(ID BIGINT NOT NULL, NAME VARCHAR(50) NOT NULL)';
END`)
        } catch (err) {
            // 335544351 unsuccessful metadata update, CREATE TABLE TEST failed, Table TEST already exists, At block line: 1, col: 24
            logFb(err)
        }
        await tx.commit();
        await con.detach();
        // // const c = await fb.query('SELECT * FROM users WHERE user = ?', ['test'])

    }).catch((err) => {
    logFb(err)
    con.detach();
})
