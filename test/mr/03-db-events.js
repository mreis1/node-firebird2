const fb = require('../../lib');
const {logFb} = require("./common/log-fb-err");

//
fb.promises.attach(config)
    .then(async (con) => {
        const evtmgr = await con.attachEvent()
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

        try {
            await con.query('EXECUTE BLOCK AS BEGIN ' +
                '' +
                `POST_EVENT 'event_name';` +
                `POST_EVENT 'evt1';` +
                `POST_EVENT 'evt2';` +
                '' +
                'END')
        } catch (err) {
            // 335544351 unsuccessful metadata update, CREATE TABLE TEST failed, Table TEST already exists, At block line: 1, col: 24
            logFb(err)
        }


        console.log('Disconnecting in 5s')
        setTimeout(() => {
            // await tx.commit();
            con.detach()
                .then(() => console.log('Successfully detached from database'))
                .catch(logFb);
        }, 5000)
        // try {
        //     // console.log(await tx.query('SELECT * FROM TEST;'))
        // } catch (err) {
        //     // 335544361 attempted update during read-only transaction
        //     logFb(err)
        // }
        // try {
        //     const query = `INSERT INTO TEST VALUES(${Date.now()},\'TEST LABEL\')`;
        //     // console.log(query);
        //     const res = await tx.query(query)
        //     console.log('Insert completed');
        //     // console.log(res);
        // } catch (err) {
        //     logFb(err)
        // }
        // try {
        //     const query = `INSERT INTO TEST VALUES(${Date.now()},\'TEST LABEL\') RETURNING ID, NAME`;
        //     // console.log(query);
        //     const res = await tx.query(query)
        //     console.log(res);
        //     // console.log(res);
        // } catch (err) {
        //     logFb(err)
        // }
        // //


    }).catch(logFb)
