/**
 * # USAGE
 * ⚠️ Note: This example uses db.query() which differs internally from tx.query()
 *          in db.query() blobs are fetched immediately
 *
 * ```
 * $ cd ./test/mr
 * $ FB_HOST= FB_DB= node 14-charset-sync-blob-memo.js --seq
 *
 * === Charset NONE: UTF8 <> WIN1252 (inserting 3 rows | fetching 5 rows) ===
 *
 *
 * ✅ Selected 1 rows
 * ⏱️  BLOB fetch took 0s
 * {
 *   rows: [
 *     {
 *       PSART_ID: 1003001237675,
 *       PSART_LABEL: '* TRIAL ARTICLE (SCAN CDB = 010000000401)',
 *       PSART_DESC_SHORT: '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ',
 *       PSART_DESC_LONG: '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ',
 *     }
 *   ]
 * }
 * ✅ Test completed successfully
 *
 */

const fb = require('../../lib/index');
const fs = require('fs');
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
    database: process.env.FB_ALIAS || process.env.FB_DB || 'db_alias',
    user: process.env.FB_USER || 'SYSDBA',
    password: process.env.FB_PASSWORD || 'masterkey',
    encoding: 'NONE',
    transcodeAdapter,
    blobAsText: true,
};

// value prior to insertion    -->
// insertion result for "NAME" -->          â‚¬â€šÆ’â€žâ€¦â€ â€¡Ë†â€°Å â€¹Å’Å½â€˜â€™â€œâ€â€¢â€“â€”Ëœâ„¢Å¡â€ºÅ“Å¾Å¸
// insertion result for "DATA2" ->          â‚¬â€šÆ’â€žâ€¦â€ â€¡Ë†â€°Å â€¹Å’Å½â€˜â€™â€œâ€â€¢â€“â€”Ëœâ„¢Å¡â€ºÅ“Å¾Å¸
//                                          The quick brown fox jumps over the lazy dog. 1234567890

// Parse command-line arguments
const mode = (function () {
    const v = +process.argv.find(v => v.startsWith('--mode='))?.split('=')[1];
    return isNaN(v) ? undefined : v;
})();

const numRows = (function () {
    const v = +process.argv.find(v => v.startsWith('--rows='))?.split('=')[1];
    return isNaN(v) ? 3 : v; // Default to 3 rows
})();

const fetchSize = (function(){
    const v = +process.argv.find(v => v.startsWith('--fetchSize='))?.split('=')[1];
    return (isNaN(v) ? undefined : v) ?? 5;
})()

const win1252_extra_chars = [
    "€",    // 0x80
    null,   // 0x81 (undefined in Win-1252)
    "‚",    // 0x82
    "ƒ",    // 0x83
    "„",    // 0x84
    "…",    // 0x85
    "†",    // 0x86
    "‡",    // 0x87
    "ˆ",    // 0x88
    "‰",    // 0x89
    "Š",    // 0x8A
    "‹",    // 0x8B
    "Œ",    // 0x8C
    null,   // 0x8D (undefined)
    "Ž",    // 0x8E
    null,   // 0x8F (undefined)
    null,   // 0x90 (undefined)
    "‘",    // 0x91
    "’",    // 0x92
    "“",    // 0x93
    "”",    // 0x94
    "•",    // 0x95
    "–",    // 0x96
    "—",    // 0x97
    "˜",    // 0x98
    "™",    // 0x99
    "š",    // 0x9A
    "›",    // 0x9B
    "œ",    // 0x9C
    null,   // 0x9D (undefined)
    "ž",    // 0x9E
    "Ÿ"     // 0x9F
].filter(i => i !== null);

const REFERENCE_NAME = win1252_extra_chars.join('');
const tableName = 'test_blob_utf_win1252_1'




console.log(`=== Charset NONE: UTF8 <> WIN1252 (inserting ${numRows} rows | fetching ${fetchSize} rows) ===\n`);

// €‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ

const delayExit = (code, err, t = 3e3) => {
    if (err) {
        console.trace('❌', err);
    }
    console.log(`⌛️ Exiting with code(${code}) in ` + t);
    setTimeout(() => {
        console.log('👋');
        process.exit(code);
    }, t);
};

fb.attach(options, (err, db) => {
    if (err) throw err;
        db.query(`SELECT first ${fetchSize} * FROM ${tableName} WHERE NAME=?`, [REFERENCE_NAME], async (err, rows) => {
            if (err) return delayExit(1, err);

            console.log(`\n✅ Selected ${rows.length} rows`);

            /*
  ____  _     ___  ____    ______   ___   _  ____
 | __ )| |   / _ \| __ )  / ___\ \ / / \ | |/ ___|
 |  _ \| |  | | | |  _ \  \___ \\ V /|  \| | |
 | |_) | |__| |_| | |_) |  ___) || | | |\  | |___
 |____/|_____\___/|____/  |____/ |_| |_| \_|\____|

            if (!process.argv.includes('--skip-blob-fetching')) {
                const fetchStart = Date.now();
                if (process.argv.includes('--seq')) {
                    // Sequential BLOB fetching - one at a time
                    await loadBlobs(rows, null);
                } else {
                    // Parallel BLOB fetching - all at once
                    await loadBlobsParallel(rows, null);
                }
                const fetchEnd = Date.now();
                console.log(`⏱️  BLOB fetch took ${(fetchEnd - fetchStart) / 1000}s`);
            }

             */

            console.log({rows})

            // Cleanup and exit
            db.detach((err) => {
                if (err) return delayExit(1, err);
                console.log('✅ Test completed successfully');
                process.exit(0);
            });
        })
});



/**
 * Reads a single blob field and returns a promise
 */
function readBlob(blobFn, columnName, rowIndex, tx) {
    return new Promise((resolve, reject) => {
        const args = [];
        if (process.argv.includes('--passTxToBlob')) {
            args.push(tx);
        }
        args.push((err, name, event) => {
            if (err) return reject(err);

            const chunks = [];
            event.on('data', chunk => {
                chunks.push(Buffer.from(chunk));
            });
            let isText = false, textValue;
            event.on('text', (value) => {
                isText = true;
                textValue = value;
                resolve({ buffer: Buffer.from(value), column: columnName, row: rowIndex });
            });
            event.on('end', () => {
                if (!isText)
                    resolve({ buffer: Buffer.concat(chunks), column: columnName, row: rowIndex });
            });
            event.on('error', reject);
        });
        blobFn(...args);
    });
}

async function loadBlobs(rows, tx) {
    const blobPromises = [];

    let idx = 0;
    for (let row of rows) {
        Object.keys(row).forEach(key => {
            let i = idx;
            if (typeof row[key] === 'function') {
                blobPromises.push(() => readBlob(row[key], key, i, tx));
            }
        });
        idx++;
    }

    for (let b of blobPromises) {
        const s = Date.now();
        const { buffer,
            column,
            row } = await b();
        console.log(`Row=${row} Column=${column} took ${(Date.now()-s)/1000}s to load. Size=${buffer.length}`);
        fs.writeFileSync(`t_row_${row}_${column}`, buffer, { encoding: 'binary' });
        // rows[row][column] = transcodeAdapter.text.fromDb(buffer);
        rows[row][column] = buffer.toString('utf8')
    }

    return rows;
}



async function loadBlobsParallel(rows, tx) {
    const blobPromises = [];

    let idx = 0;
    for (let row of rows) {
        Object.keys(row).forEach(key => {
            let i = idx;
            if (typeof row[key] === 'function') {
                blobPromises.push(readBlob(row[key], key, i, tx));
            }
        });
        idx++;
    }

    const r = await Promise.all(blobPromises);
    r.forEach(({ buffer,
                   column,
                   row }, i) => {
        rows[row][column] = buffer;
    })
    /*for (let b of blobPromises) {
        const  {value,
            column,
            row} = await b();
        console.log({value,column,row});
        rows[row][column] = value;
    }*/

    return rows;
}
