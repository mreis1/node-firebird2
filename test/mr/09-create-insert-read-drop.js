const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');


let con;
fb.promises.attach(config[process.argv[2]])
    .then(async (_con) => {
        con = _con;
        const tx = await con.transaction(fb.ISOLATION_READ_COMMITED_READ_ONLY);

        try {
            console.log('1.-------')
            console.log('Reading data from XXX_TEST')
            console.log(await tx.query('SELECT * FROM XXX_TEST'))
        } catch (err) {
            // 335544361 attempted update during read-only transaction
            logFb(err)
        }


        try {
            console.log('2.-------')
            console.log('Attempting to create table')
            await tx.query(`EXECUTE BLOCK AS BEGIN
EXECUTE STATEMENT 'CREATE TABLE XXX_TEST(ID BIGINT NOT NULL, NAME VARCHAR(50) NOT NULL)';
END`)
            console.log('Table successfully created')
        } catch (err) {
            // 335544351 unsuccessful metadata update, CREATE TABLE TEST failed, Table TEST already exists, At block line: 1, col: 24
            logFb(err)
        }

        try {
            await tx.restart();
            console.log('3.-------')
            console.log('Reading data from XXX_TEST')
            console.log(await tx.query('SELECT * FROM XXX_TEST'))

        } catch (err) {
            // 335544361 attempted update during read-only transaction
            logFb(err)
        }
        // try {
        //     const query = `INSERT INTO XXX_TEST(ID, NAME) VALUES (${Date.now()},\'TEST LABEL\') RETURNING ID`;
        //     const res = await tx.query(query)
        //     console.log('Insert completed', res);
        // } catch (err) {
        //     logFb(err)
        // }
        //
        // try {
        //     console.log(await tx.query('SELECT * FROM XXX_TEST'))
        // } catch (err) {
        //     // 335544361 attempted update during read-only transaction
        //     logFb(err)
        // }

        // await tx.commitRetaining();
        try {
            await tx.commitRetaining();
            // await tx.restart();
            console.log('4.-------')
            console.log('Attempting to drop table')
            await tx.query('EXECUTE BLOCK AS BEGIN ' +
                '' +
                `EXECUTE STATEMENT 'DROP TABLE XXX_TEST';` +
                '' +
                'END')
            console.log('Table successfully dropped')
        } catch (err) {
            console.log('xxx');
            // 335544351 unsuccessful metadata update, CREATE TABLE TEST failed, Table TEST already exists, At block line: 1, col: 24
            logFb(err)
        }
        await tx.commit();
        await con.detach();
        // // const c = await fb.query('SELECT * FROM users WHERE user = ?', ['test'])

    }).catch((err) => {
        logFb(err)
        con?.detach?.();
})
