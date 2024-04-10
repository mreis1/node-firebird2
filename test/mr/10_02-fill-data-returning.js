const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');


let con;
fb.promises.attach(config[process.argv[2]])
    .then(async (_con) => {
        con = _con;
        const tx = await con.transaction(fb.ISOLATION_READ_COMMITED_READ_ONLY); // <-- start with readonly tx.

        try {
            const query = `
EXECUTE BLOCK RETURNS(DID_CREATE BIGINT) AS 
BEGIN
    DID_CREATE = 0;
    IF (F_TABLE_EXISTS('XXX_TEST') = 0) THEN
    BEGIN
        EXECUTE STATEMENT 'CREATE TABLE XXX_TEST(ID BIGINT NOT NULL, NAME VARCHAR(50) NOT NULL)';
        DID_CREATE = -1;
    END
    SUSPEND;
    EXIT; 
END
            `;
            console.log(query)
            const row = (await tx.query(query))[0];
            await tx.restart();
            console.log(row);
        } catch (err) {

        }

        try {
            const query = `INSERT INTO XXX_TEST(ID, NAME) VALUES (${Date.now()},\'TEST LABEL\') RETURNING ID`;
            const res = await tx.query(query)
            await tx.restart();
            console.log('Insert completed', res);
        } catch (err) {
            logFb(err)
        }

        try {
            const query = `DROP TABLE XXX_TEST;`;
            const res = await tx.query(query)
            console.log('Table dropped', res);
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
