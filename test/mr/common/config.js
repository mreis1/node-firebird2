exports.config = {
    docker: {
        //  Problem with privileges in OSX
        //  database: Path.join(os.tmpdir(), 'test-' + new Date().getTime() + '.fdb'),

        database: '/firebird/data/test_db',// path.join(process.cwd(), 'test-' + new Date().getTime() + '.fdb'),
            host: '127.0.0.1'/*'10.211.55.3'*/,     // default
            port: 3060,            // default
            user: 'SYSDBA',        // default
            password: 'sysdba_masterkey', // default
            role: null,            // default
            pageSize: 4096,        // default when creating database
            timeout: 3000          // default query timeout
    },
    wk: {
        //  Problem with privileges in OSX
        //  database: Path.join(os.tmpdir(), 'test-' + new Date().getTime() + '.fdb'),

        database: 'DEV_CS1_1_3',// path.join(process.cwd(), 'test-' + new Date().getTime() + '.fdb'),
            host: process.env.FB_SERVER_WK,     // default
            port: 3050,            // default
            user: 'SYSDBA',        // default
            password: process.env.FB_PASSWORD, // default
            role: null,            // default
            pageSize: 4096,        // default when creating database
            timeout: 3000          // default query timeout
    },
    vm0: {
        //  Problem with privileges in OSX
        //  database: Path.join(os.tmpdir(), 'test-' + new Date().getTime() + '.fdb'),

        database: 'DEV_CS1_1_3',// path.join(process.cwd(), 'test-' + new Date().getTime() + '.fdb'),
            host: '127.0.0.1'/*'10.211.55.3'*/,     // default
            port: 3060,            // default
            user: 'SYSDBA',        // default
            password: process.env.FB_PASSWORD, // default
            role: null,            // default
            pageSize: 4096,        // default when creating database
            timeout: 3000          // default query timeout
    },
    vm1: {
        //  Problem with privileges in OSX
        //  database: Path.join(os.tmpdir(), 'test-' + new Date().getTime() + '.fdb'),

        database: 'DEV_CS1_1_3',// path.join(process.cwd(), 'test-' + new Date().getTime() + '.fdb'),
        host: '10.211.55.3',     // default
        port: 3050,            // default
        user: 'SYSDBA',        // default
        password: process.env.FB_PASSWORD, // default
        role: null,            // default
        pageSize: 4096,        // default when creating database
        timeout: 3000          // default query timeout
    },
    vm2: {
        //  Problem with privileges in OSX
        //  database: Path.join(os.tmpdir(), 'test-' + new Date().getTime() + '.fdb'),

        database: 'DEV_CS1_1_3',// path.join(process.cwd(), 'test-' + new Date().getTime() + '.fdb'),
        host: '127.0.0.1',     // default
        port: 3050,            // default
        user: 'SYSDBA',        // default
        password: process.env.FB_PASSWORD, // default
        role: null,            // default
        pageSize: 4096,        // default when creating database
        timeout: 3000          // default query timeout
    }
}
