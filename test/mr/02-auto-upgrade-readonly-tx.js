const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const config = {
    //  Problem with privileges in OSX
    //  database: Path.join(os.tmpdir(), 'test-' + new Date().getTime() + '.fdb'),

    database: '/firebird/data/test_db',// path.join(process.cwd(), 'test-' + new Date().getTime() + '.fdb'),
    host: '127.0.0.1',     // default
    port: 3050,            // default
    user: 'SYSDBA',        // default
    password: 'sysdba_masterkey', // default
    role: null,            // default
    pageSize: 4096,        // default when creating database
    timeout: 3000          // default query timeout
}

//
fb.promises.attach(config)
    .then(async (con) => {
        const tx = await con.transaction(fb.ISOLATION_READ_COMMITED_READ_ONLY);
        try {
            await tx.query('EXECUTE BLOCK AS BEGIN ' +
                '' +
                `EXECUTE STATEMENT 'CREATE TABLE TEST(ID BIGINT NOT NULL, NAME VARCHAR(50));';` +
                '' +
                'END')
        } catch (err) {
            // 335544351 unsuccessful metadata update, CREATE TABLE TEST failed, Table TEST already exists, At block line: 1, col: 24
            logFb(err)
        }
        try {
            // console.log(await tx.query('SELECT * FROM TEST;'))
        } catch (err) {
            // 335544361 attempted update during read-only transaction
            logFb(err)
        }
        try {
            const query = `INSERT INTO TEST VALUES(${Date.now()},\'TEST LABEL\')`;
            // console.log(query);
            const res = await tx.query(query)
            console.log('Insert completed');
            // console.log(res);
        } catch (err) {
            logFb(err)
        }
        try {
            const query = `INSERT INTO TEST VALUES(${Date.now()},\'TEST LABEL\') RETURNING ID, NAME`;
            // console.log(query);
            const res = await tx.query(query)
            console.log(res);
            // console.log(res);
        } catch (err) {
            logFb(err)
        }
        //
        await tx.commit();
        await con.detach();

    }).catch(logFb)
