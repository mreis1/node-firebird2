const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');
const {delay} = require("./common/delay");


let con;
fb.promises.attach(config[process.argv[2]])
    .then(async (con) => {
        const tx = await con.transaction();
        await _triggerEvents(con, process.argv[3].split(','), 3000);
        await tx.commit();
        await con.detach();
    }).catch(logFb)

async function _triggerEvents(db, events, _delay = 2500) {
    await delay(_delay);
    if (events.length === 0) {
        throw new Error('events should not be empty')
    }
    const query = `EXECUTE BLOCK AS BEGIN 
${events.map(event => `POST_EVENT '${event}'`).join(';')};
END`;
    console.log(query)
    await db.query(query)
}

