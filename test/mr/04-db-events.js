const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {delay} = require('./common/delay');
const {config} = require('./common/config');

let  con;
function init() {
    fb.promises.attach(config[process.argv[2]])
        .then(async (_con) => {
            con = _con;
            await _setEvent(con);
            _triggerEvents(con, ['post_event'], 3000);
        })
        .catch(err => {
            console.log(err)
            con?.detach();
        })
}

init();

async function _setEvent(db) {
    const evtmgr = await db.attachEvent()
    console.log('evtmgr=> ' , evtmgr);


    evtmgr.on("post_event", function (name, count) {
        console.log("post_event fired: ", name, count);
    });

    // register additional events
    evtmgr.registerEvent(['evt1', 'evt2'], async function (err) {
        console.log('ready to receive evt1 and evt2')
    })

    setTimeout(() => {
        evtmgr.unregisterEvent(["evt1"], function (err) {
            console.log('remove evt1, after that you only receive evt2')
        })
    },2500)
    return evtmgr;
}

async function _triggerEvents(db, events, _delay = 2500 ) {
    await delay(_delay);
    if (events.length === 0) {
        throw new Error('events should not be empty')
    }
    await db.query(`EXECUTE BLOCK AS BEGIN 
${events.map(event => `POST_EVENT '${event}'`).join(';')};
END`)
}

