// Server-less unit tests for the connection-resilience options. They drive the
// driver's Connection / Database / promises.Db objects against a plain TCP server,
// never a Firebird server, so they run anywhere with `npm run test:unit`.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { EventEmitter } = require('node:events');
const fb = require('../../lib');

function listen() {
	return new Promise((resolve) => {
		const server = net.createServer();
		server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
	});
}
function once(emitter, event) {
	return new Promise((resolve) => emitter.once(event, resolve));
}
function connect(port, options) {
	return new Promise((resolve) => {
		const conn = new fb.Connection('127.0.0.1', port, () => {}, options);
		conn._socket.once('connect', () => resolve(conn));
	});
}
async function close(server) {
	await new Promise((resolve) => server.close(() => resolve()));
}

test('keepalive is enabled by default with a 30s delay, configurable, and can be disabled', async () => {
	const calls = [];
	const original = net.Socket.prototype.setKeepAlive;
	net.Socket.prototype.setKeepAlive = function (enable, delay) {
		calls.push([enable, delay]);
		return original.call(this, enable, delay);
	};
	const { server, port } = await listen();
	try {
		let conn = await connect(port, {});
		assert.deepEqual(calls, [[true, 30000]], 'default: keepalive on, 30s');
		conn._socket.destroy();

		calls.length = 0;
		conn = await connect(port, { keepAliveDelayMs: 5000 });
		assert.deepEqual(calls, [[true, 5000]], 'custom delay');
		conn._socket.destroy();

		calls.length = 0;
		conn = await connect(port, { keepAlive: false });
		assert.deepEqual(calls, [], 'disabled');
		conn._socket.destroy();
	} finally {
		net.Socket.prototype.setKeepAlive = original;
		await close(server);
	}
});

test('socketTimeoutMs destroys an inactive socket with an explicit error', async () => {
	const { server, port } = await listen();
	try {
		const conn = await connect(port, { socketTimeoutMs: 50, maxReconnectAttempts: 0 });
		const db = new fb.Database(conn);
		const err = await once(conn._socket, 'error');
		assert.match(err.message, /Socket inactive for 50ms/);
		await once(conn._socket, 'close');
		assert.equal(conn._isClosed, true);
		assert.equal(db.lastError, err, 'the error is remembered on the Database');
	} finally {
		await close(server);
	}
});

test('Database reads maxReconnectAttempts from the connection options and installs a no-op error listener', () => {
	const fakeConn = (options) => ({ options });
	assert.equal(new fb.Database(fakeConn({})).maxtryreconnect, 3, 'default unchanged');
	assert.equal(new fb.Database(fakeConn({ maxReconnectAttempts: 0 })).maxtryreconnect, 0);
	assert.equal(new fb.Database(fakeConn({ maxReconnectAttempts: 7 })).maxtryreconnect, 7);
	assert.equal(new fb.Database(fakeConn({ maxReconnectAttempts: -1 })).maxtryreconnect, 3, 'negative falls back');
	assert.equal(new fb.Database({}).maxtryreconnect, 3, 'no options at all');

	const db = new fb.Database(fakeConn({}));
	assert.equal(db.listenerCount('error'), 1);
	// An 'error' event with only the default listener must not throw.
	assert.doesNotThrow(() => db.emit('error', new Error('socket says no')));
});

test('with maxReconnectAttempts=0 a dropped socket fails the queued calls at once and emits destroy', async () => {
	const { server, port } = await listen();
	let serverSocket;
	server.on('connection', (s) => (serverSocket = s));
	try {
		const conn = await connect(port, { maxReconnectAttempts: 0 });
		const db = new fb.Database(conn);
		conn._isDetach = false; // simulate: database attached, so the close handler takes the reconnect branch
		const queued = new Promise((resolve) => conn._queue.push((err) => resolve(err)));
		const destroyed = once(db, 'destroy');

		const started = Date.now();
		serverSocket.destroy(); // peer goes away
		const err = await queued;
		await destroyed;

		assert.match(err.message, /Connection is closed\./);
		assert.ok(Date.now() - started < 500, `queued call failed in ${Date.now() - started}ms, expected no 1s reconnect delay`);
		assert.equal(conn._isClosed, true);
	} finally {
		await close(server);
	}
});

test('with reconnect attempts left the queued calls are failed once the attempts are exhausted', async () => {
	const { server, port } = await listen();
	let serverSocket;
	server.on('connection', (s) => (serverSocket = s));
	const conn = await connect(port, { maxReconnectAttempts: 1, filename: 'x.fdb' });
	const db = new fb.Database(conn);
	conn._isDetach = false;
	const queued = new Promise((resolve) => conn._queue.push((err) => resolve(err)));
	const destroyed = once(db, 'destroy');

	serverSocket.destroy();
	await close(server); // nothing to reconnect to: the single attempt fails
	const err = await queued;
	await destroyed;
	assert.match(err.message, /Connection is closed\./);
	assert.equal(db.maxtryreconnect, 0);
});

test('promises.Db exposes the driver object, the closed state and the last error', () => {
	const original = Object.assign(new EventEmitter(), { connection: { _isClosed: false }, lastError: undefined });
	const db = new fb.promises.Db(original);
	assert.equal(db.original, original);
	assert.equal(db.isClosed, false);
	assert.equal(db.lastError, undefined);
	original.connection._isClosed = true;
	original.lastError = new Error('ECONNRESET');
	assert.equal(db.isClosed, true);
	assert.equal(db.lastError.message, 'ECONNRESET');
	assert.equal(new fb.promises.Db(undefined).isClosed, false, 'no driver object: not closed, not throwing');
});
