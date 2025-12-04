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
 *       PSART_GIFT: 0,
 *       PSART_DESC_SHORT: '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ',
 *       PSART_DESC_LONG: '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ',
 *       PSART_EXPRESS: 0,
 *       PSART_CREATION_IDCTR: 1003,
 *       PSART_IDART: 1003001095307,
 *       PSART_IDPSEC: 1003001237674,
 *       PSART_ORDER: 1,
 *       PSART_IDMED_IMG: null,
 *       PSART_IDMED_IMG2: null
 *     }
 *   ]
 * }
 * ✅ Test completed successfully
 *
 */

const fb = require('../../lib/index');
const fs = require('fs');
const iconv = require('iconv-lite');
const {ISOLATION_READ_COMMITED} = require("../../lib");

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
const useTx = process.argv.find(v => v === '--tx');

fb.promises.attach(options)
    .then(async (tx) => {
        console.log('Connected', tx)

        const rows = await tx.query(`SELECT first ${fetchSize} * FROM ${'PSALE_ARTICLE'} WHERE PSART_ID=?`, [1003001237675])
        console.log(`\n✅ Selected ${rows.length} rows`);
        console.log(rows);

        await tx.detach();
        // Cleanup and exit
        console.log('✅ Test completed successfully');
        process.exit(0);
    })
    .catch((err) =>delayExit(1, err));
