exports.logFb = function logFb(err) {
    return console.log(`❌` + ([(err?.code ?? ''), (err?.message ?? '')].join(' ')));
}
