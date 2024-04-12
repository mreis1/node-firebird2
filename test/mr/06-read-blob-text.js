const fs = require('fs');
const path = require('path');
const os = require('os');
const fb = require('../../lib');
const {config} = require('./common/config');


function init() {
    fb.promises.attach(config[process.argv[2]])
        .then(async (db) => {
            await queryFromDb(db)
            await queryFromTx(db);
            db.detach();
        })
}

init();


async function queryFromDb(db) {
    const rows = await db.query('SELECT LDON_ID, LDON_CLE FROM LICENCE_DONGLE');
    for (const row of rows) {
        const content = await db.readBlob(row.LDON_CLE, {type: "utf8"});
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
    for (const row of rows) {
        const content = await tx.readBlob(row.LDON_CLE, {type: "utf8"});
        const alias = row.LDON_ID + '_tx';
        const filePath = path.join(os.tmpdir(), 'ldon_' + (alias ? `_${alias}`: '') + '.txt');
        console.log('(db) Writing ldon_ to ' + filePath)
        await fs.promises.writeFile(filePath, content);
    }
    console.log('Query from Tx OK');
}
