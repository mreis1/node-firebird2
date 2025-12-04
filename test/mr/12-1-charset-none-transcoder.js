/**
 * USAGE
 *
 * ```
 * $ cd ./test/mr
 * $ FB_HOST= FB_DB= node 12-charset-none-transcoder.js --fetchSize=2 --rows=2 --seq
 *
 * === Charset NONE: UTF8 <> WIN1252 (inserting 2 rows | fetching 2 rows) ===
 *
 * ✅ Connected
 * [ ] Recreate table
 * ✅ Table created
 * ✅ Table committed
 * ✅ Inserted row #1.
 * ✅ Inserted row #2.
 * ✅ 2 BLOBs inserted. Committing...
 * ✅ All rows committed
 *
 * ✅ Selected 2 rows
 * ⏱️  BLOB fetch took 9.031s
 * ✅ BLOB content verified (SHA-1)
 * {
 *   rows: [
 *     {
 *       ID: 1,
 *       NAME: '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ',
 *       DATA2: <Buffer e2 82 ac e2 80 9a c6 92 e2 80 9e e2 80 a6 e2 80 a0 e2 80 a1 cb 86 e2 80 b0 c5 a0 e2 80 b9 c5 92 c5 bd e2 80 98 e2 80 99 e2 80 9c e2 80 9d e2 80 a2 e2 ... 262107 more bytes>,
 *       DATA: <Buffer 25 50 44 46 2d 31 2e 33 0a 25 c4 e5 f2 e5 eb a7 f3 a0 d0 c4 c6 0a 34 20 30 20 6f 62 6a 0a 3c 3c 20 2f 4c 65 6e 67 74 68 20 35 20 30 20 52 20 2f 46 69 ... 49622 more bytes>
 *     },
 *     {
 *       ID: 2,
 *       NAME: '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ',
 *       DATA2: <Buffer e2 82 ac e2 80 9a c6 92 e2 80 9e e2 80 a6 e2 80 a0 e2 80 a1 cb 86 e2 80 b0 c5 a0 e2 80 b9 c5 92 c5 bd e2 80 98 e2 80 99 e2 80 9c e2 80 9d e2 80 a2 e2 ... 262107 more bytes>,
 *       DATA: <Buffer 25 50 44 46 2d 31 2e 33 0a 25 c4 e5 f2 e5 eb a7 f3 a0 d0 c4 c6 0a 34 20 30 20 6f 62 6a 0a 3c 3c 20 2f 4c 65 6e 67 74 68 20 35 20 30 20 52 20 2f 46 69 ... 49622 more bytes>
 *     }
 *   ]
 * }
 * 20428
 * ✅ Test completed successfully
 * ```
 *
 */


const fb = require('../../lib/index');
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


const tableName = 'test_blob_utf_win1252_12_1'


const sampleTextPath = path.join(__dirname, '../sample.txt');
const samplePdfPath = path.join(__dirname, '../sample.pdf');
const REFERENCE_NAME = win1252_extra_chars.join('');
const referenceBlobs = mode === 1 ? {
    DATA: fs.readFileSync(sampleTextPath),
    DATA2: fs.readFileSync(samplePdfPath)
} : null;

const hashBuffer = (buffer) => crypto.createHash('sha1').update(buffer).digest('hex');
const describeBlob = (value) => Buffer.isBuffer(value) ? `${value.length} bytes (buffer)` : `${(value?.length || 0)} bytes (${typeof value})`;



console.log(`=== Charset NONE: UTF8 <> WIN1252 (inserting ${numRows} rows | fetching ${fetchSize} rows | table ${tableName}) ===\n`);

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
let start = Date.now()
fb.attach(options, (err, db) => {
    if (err) throw err;

    console.log('✅ Connected');


    db.transaction(fb.ISOLATION_READ_COMMITED, (err, tx) => {
        if (err) throw err;
        const querySelect = () => {
            let promStack = []
            // Query back all rows
            // tx.query(`SELECT first ${fetchSize} * FROM ${tableName} WHERE NAME=?`, [REFERENCE_NAME], async (err, rows) => {
            tx.query(`SELECT first ${fetchSize} * FROM ${tableName} WHERE NAME='${REFERENCE_NAME}'`, [], async (err, rows) => {
                if (err) return delayExit(1, err);

                console.log(`\n✅ Selected ${rows.length} rows`);




                if (!process.argv.includes('--skip-blob-fetching')) {
                    const fetchStart = Date.now();
                    if (process.argv.includes('--seq')) {
                        // Sequential BLOB fetching - one at a time
                        await loadBlobs(rows, tx);
                    } else {
                        // Parallel BLOB fetching - all at once
                        await loadBlobsParallel(rows, tx);
                    }
                    const fetchEnd = Date.now();
                    console.log(`⏱️  BLOB fetch took ${(fetchEnd - fetchStart) / 1000}s`);
                    const integrityIssues = verifyIntegrity(rows);
                    if (integrityIssues.length) {
                        console.warn('❌ BLOB integrity issues detected:', integrityIssues);
                    } else {
                        console.log('✅ BLOB content verified (SHA-1)');
                    }
                }

                console.log({rows})

                // Cleanup and exit
                tx.commit((err) => {
                    if (err) return delayExit(1, err);
                    let end = Date.now()
                    console.log(end-start)
                    db.detach((err) => {
                        if (err) return delayExit(1, err);
                        console.log('✅ Test completed successfully');
                        process.exit(0);
                    });
                });
            });
        }
        const handleInserts = () => {
            // Insert BLOBs dynamically based on numRows
            let count = 0;
            const _insertExec = (cb) => {
                count++;
                tx.query(`INSERT INTO ${tableName} (id, name, data2, data) VALUES (?, ?, ?, ?)`,
                    [count, REFERENCE_NAME, fs.createReadStream(sampleTextPath), fs.createReadStream(samplePdfPath)],
                    (...args) => {
                        console.log('✅ Inserted row #' + count + '.');
                        cb(...args);
                    });
            };

            // Recursive function to insert N rows
            const insertRows = (remaining, finalCallback) => {
                if (remaining === 0) {
                    return finalCallback();
                }
                _insertExec((err) => {
                    if (err) return delayExit(1, err);
                    insertRows(remaining - 1, finalCallback);
                });
            };


            // Trace: ❌ Error [GDSError]: Cannot transliterate character between character sets

            // Start inserting
            insertRows(numRows, () => {
                console.log(`✅ ${numRows} BLOBs inserted. Committing...`);

                tx.commitRetaining((err) => {
                    if (err) return delayExit(1, err);
                    console.log('✅ All rows committed');
                    querySelect()
                });
            });
        }
        if (process.argv.find(v => v === '--noRecreate')) {
            if (process.argv.find(v => v === '--fetchOnly'))
                querySelect()
            else
                handleInserts()



        } else {
            console.log('[ ] Recreate table')
            // Create table
            tx.query(`RECREATE TABLE ${tableName} (id Integer, name varchar(100), data2 BLOB SUB_TYPE 1, data BLOB SUB_TYPE 0)`, (err) => {
                if (err) return delayExit(1, err);

                console.log('✅ Table created');
                tx.commitRetaining((err) => {
                    if (err) return delayExit(1, err);
                    console.log('✅ Table committed');

                    handleInserts()
                });
            });
        }
    });
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
            event.on('end', () => {
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
        rows[row][column] = buffer;
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

const expectedBlobValues = mode === 1 ? {
    DATA: hashBuffer(referenceBlobs.DATA),
    DATA2: hashBuffer(referenceBlobs.DATA2)
} : {}

function verifyIntegrity(rows) {
    const issues = [];

    rows.forEach((row) => {
        ['DATA', 'DATA2'].forEach((column) => {
            if (column in row && row[column] !== null) {
                const actual = row[column];
                const expectedBuf = expectedBlobValues?.[column];

                if (!Buffer.isBuffer(actual)) {
                    issues.push({ row: row.ID, column, error: 'Missing BLOB buffer' });
                    return;
                }

                if (!expectedBuf) {
                    return;
                }

                if (!actual.equals(expectedBuf)) {
                    issues.push({
                        row: row.ID,
                        column,
                        expectedBytes: expectedBuf.length,
                        actualBytes: actual.length,
                        expectedHash: hashBuffer(expectedBuf),
                        actualHash: hashBuffer(actual)
                    });
                }
            }
        });
    });

    return issues;
}
