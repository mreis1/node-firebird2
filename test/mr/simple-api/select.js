const fb = require('../../../lib');
const {logFb} = require("./../common/log-fb-err");
const {config} = require('./../common/config');

fb.attach(config[process.argv[2]], (err, con) => {
    if (err) return logFb(err);
    console.log(con);
    con.query('SELECT FIRST 10 CLI_ID, CLI_NOM FROM CLIENTS', (err, rows) => {
        if (err) {
            logFb(err);
            return con?.detach();
        }
        console.log(rows);
        con.detach();
    });
})


