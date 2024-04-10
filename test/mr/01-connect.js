const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');


let con;
fb.promises.attach(config[process.argv[2]])
    .then(async (_con) => {
        con = _con;
        await con.detach();
    }).catch((err) => {
        logFb(err)
        con.detach();
})
