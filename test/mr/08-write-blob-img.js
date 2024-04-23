const fs = require('fs');
const path = require('path');
const os = require('os');
const fb = require('../../lib');
const {config} = require('./common/config');


function init() {
    fb.promises.attach(config[process.argv[2]])
        .then(async (db) => {
            await insertFromDb(db)
            await insertFromTx(db);
            db.detach();
        })
}

init();


async function insertFromDb(db) {
    const rows = await db.query('INSERT INTO CLIENTS_PHOTO(CPHO_ID, CPHO_CONTENU) VALUES(NEXT VALUE FOR IDGENERIQUE, ?)', [
        fs.createReadStream
    ]);
    // for (const row of rows) {
    //     const content = await db.readBlob(row.CPHO_PHOTO, {type: "blob"});
    //     const alias = row.CPHO_ID + '_query';
    //     const imgPath = path.join(os.tmpdir(), 'img' + (alias ? `_${alias}`: ''));
    //     console.log('(db) Writing img to ' + imgPath)
    //     await fs.promises.writeFile(imgPath, content);
    // }
    console.log('Query from DB OK');
}
async function insertFromTx(db) {
    const tx = await db.transaction()
    const rows = await tx.query('SELECT FIRST 10 CPHO_ID, CPHO_PHOTO FROM CLIENTS_PHOTO');
    for (const row of rows) {
        const content = await tx.readBlob(row.CPHO_PHOTO, {type: "blob"});
        const alias = row.CPHO_ID + '_tx';
        const imgPath = path.join(os.tmpdir(), 'img' + (alias ? `_${alias}`: ''));
        console.log('(tx) Writing img to ' + imgPath)
        await fs.promises.writeFile(imgPath, content);
    }
    console.log('Query from Tx OK');
}
