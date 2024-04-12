const fs = require('fs');
const path = require('path');
const os = require('os');
const fb = require('../../lib');
const {config} = require('./common/config');


function init() {
    fb.promises.attach(config[process.argv[2]])
        .then(async (db) => {
            await Promise.all([
                queryFromDb(db),
                queryFromTx(db)
            ])

            db.detach();
        })
}

init();


async function queryFromDb(db) {
    const rows = await db.query('SELECT LDON_ID, LDON_CLE FROM LICENCE_DONGLE');
    let idx =0;
    for (const row of rows) {
        const content = await db.readBlob(row.LDON_CLE, {encoding: "utf8"});
        const subQuery = await db.query(`SELECT FIRST 2 SKIP ${(++idx)} CEMA_MESSAGE FROM CLIENTS_EMAIL WHERE CEMA_MESSAGE IS NOT NULL`)
        for (let item of subQuery) {
            item.CEMA_MESSAGE = await db.readBlob(item.CEMA_MESSAGE, {encoding: "utf8"});
        }
        console.log({subQuery})
        const alias = row.LDON_ID + '_query';
        const filePath = path.join(os.tmpdir(), 'ldon_' + (alias ? `_${alias}`: '') + '.txt');
        console.log('(db) Writing img to ' + filePath)
        await fs.promises.writeFile(filePath, content);
    }
    console.log('Query from DB OK');
}
async function queryFromTx(db) {
    const tx = await db.transaction()
    const rows = await tx.query('SELECT LDON_ID, LDON_CLE FROM LICENCE_DONGLE');
    let idx =0;
    for (const row of rows) {
        const content = await tx.readBlob(row.LDON_CLE, {encoding: "utf8"});
        const subQuery = await tx.query(`SELECT FIRST 4 SKIP ${(++idx)} CEMA_MESSAGE FROM CLIENTS_EMAIL WHERE CEMA_MESSAGE IS NOT NULL`)
        for (let item of subQuery) {
            item.CEMA_MESSAGE = await tx.readBlob(item.CEMA_MESSAGE, {encoding: "utf8"});
        }
        console.log({subQuery})
        const alias = row.LDON_ID + '_tx';
        const filePath = path.join(os.tmpdir(), 'ldon_' + (alias ? `_${alias}`: '') + '.txt');
        console.log('(db) Writing ldon_ to ' + filePath)
        await fs.promises.writeFile(filePath, content);
    }
    console.log('Query from Tx OK');
}
