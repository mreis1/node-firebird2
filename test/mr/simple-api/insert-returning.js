const fb = require('../../../lib');
const {logFb} = require("./../common/log-fb-err");
const {config} = require('./../common/config');

fb.attach(config[process.argv[2]], (err, con) => {
    if (err) return logFb(err);
    console.log(con);
    con.query('INSERT INTO CONFIGURATION (CONF_ID, CONF_CLE, CONF_VALEUR, CONF_INTERNE, CONF_CENTRE)\n' +
        'VALUES (NEXT VALUE FOR IDGENERIQUE, \'TEST_\' || CURRENT_TIMESTAMP, \'-1\', 0, null) RETURNING CONF_ID', (err, rows) => {
        if (err) {
            logFb(err);
            return con?.detach();
        }
        console.log(rows);
        con.detach();
    });
})


