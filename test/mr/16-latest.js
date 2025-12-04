const fb = require('../../lib');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const iconv = require('iconv-lite');

const transcodeAdapter = {
    text: {
        fromDb: (buffer) => iconv.decode(buffer, 'win1252'),
        toDb: (value)  => iconv.encode(value, 'win1252')
    }
};



const options = {
    host: process.env.FB_HOST || 'localhost',
    port: +(process.env.FB_PORT || 3050),
    database: process.env.FB_ALIAS || process.env.FB_DB || 'ALIAS_OR_DB_PATH',
    user: process.env.FB_USER || 'SYSDBA',
    password: process.env.FB_PASSWORD || 'masterkey',
    encoding: 'NONE',
    transcodeAdapter,
};

async function init(id) {


    console.log(options);
    const db = await fb.promises.attach(options);
    const tx = await db.transaction('write');

    /**
     * 1003001237675 ->  €‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ
     * 1003000691323 ->  PSART_DESC_SHORT PSART_DESC_LONG are empty strings
     *  1003001262998 -> PSART_DESC_SHORT PSART_DESC_LONG are nulls
     *  1003001337331 -> PSART_DESC_SHORT PSART_DESC_LONG are simple strings (no special chars)
     */

    const rows = await tx.query('SELECT FIRST 1 PSART_ID, PSART_LABEL, PSART_DESC_SHORT, PSART_DESC_LONG FROM PSALE_ARTICLE WHERE PSART_ID=?', [id]);
    const row = rows[0];
    if (!row) {
        console.log('No records found')
    } else {
        console.log(row);
        const o2 = await tx.readBlob(row.PSART_DESC_SHORT);
        console.log(o2);

    }
    await tx.commit();
    await db.detach()

}

Promise.all([
    1003001237675, 1003000691323, 1003001262998, 1003001337331
].map((id) => init(id))).then(() => console.log('Done')).catch((err) => console.log(err));
