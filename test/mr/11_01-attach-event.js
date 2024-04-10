const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");
const {config} = require('./common/config');


let con;
fb.promises.attach(config[process.argv[2]])
    .then(async (_con) => {
        con = _con;
        console.log('Creating an event manager (evtmgr)');
        const evtmgr = await con.attachEvent()
        console.log('Event manager successfully created');


        console.log('Listening for db "post_event"');
        evtmgr.on("post_event", function (name, count) {
            console.log('Received an event named ' + name + ' fired: num of calls:' + count);
        });

        const eventList = ['post_event','evt1', 'evt2'];
        evtmgr.registerEvent(eventList, async function (err) {
            if (err) {
                return console.log('Failed to register event: ', err);
            }
            console.log('Listening for db "post_event" : ' , eventList);
        })

        console.log("unregistering evt1 in 8s");
        setTimeout(() => {
            evtmgr.unregisterEvent(["evt1"], function () {
                console.log(' evt1 is no longer tracked....');
            })
        },8000)



    }).catch((err) => {
        logFb(err);
        con?.detach();
    })

process.on('SIGINT', () => {
    console.log('SIGINT received. Closing gracefully.');
    console.log(con);
    con?.detach()
        .then(() => console.log('Successfully detached from database'))
        .catch(logFb);
    setTimeout(() => {
        process.exit(0);
    }, 300)
})
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing gracefully.');

    con.detach()
        .then(() => console.log('Successfully detached from database'))
        .catch(logFb);
    setTimeout(() => {
        process.exit(0);
    }, 300)
})
