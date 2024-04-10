const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {delay} = require('./common/delay');
const {config} = require('./common/config');

function init() {
    fb.promises.attach(config[process.argv[2]])
        .then(async (con2) => {
            await _triggerEvents(con2, process.argv[3].split(','), 3000);
            con2.detach();
        })
}

init();



async function _triggerEvents(db, events, _delay = 2500 ) {
    await delay(_delay);
    if (events.length === 0) {
        throw new Error('events should not be empty')
    }
    await db.query(`EXECUTE BLOCK AS BEGIN 
${events.map(event => `POST_EVENT '${event}'`).join(';')};
END`)
}

