// Type definitions for node-firebird 0.8.3
// Project: node-firebird
// Definitions by: Marco Warm <https://github.com/MarcusCalidus>

declare module 'node-firebird2' {
    type DatabaseCallback = (err: any, db: Database) => void;

    type TransactionCallback = (err: Options, transaction: Transaction) => void;
    type QueryCallback = (err: any, result: any[]) => void;
    type SimpleCallback = (err: any) => void;
    type SequentialCallback = (row: any, index: number, next: any) => void;

    /** A transaction sees changes done by uncommitted transactions. */
    export const ISOLATION_READ_UNCOMMITTED: number[];
    /** A transaction sees changes done by uncommitted transactions.
     *  Note: Won't wait for external transactions to complete before doing what it has to do.
     *        Instead, will return the latest value.
     **/
    export const ISOLATION_READ_COMMITED_NOWAIT: number[];
    /** A transaction sees only data committed before the statement has been executed. */
    export const ISOLATION_READ_COMMITED: number[];
    /** A transaction sees during its lifetime only data committed before the transaction has been started. */
    export const ISOLATION_REPEATABLE_READ: number[];
    /**
     * This is the strictest isolation level, which enforces transaction serialization.
     * Data accessed in the context of a serializable transaction cannot be accessed by any other transaction.
     */
    export const ISOLATION_SERIALIZABLE: number[];
    export const ISOLATION_READ_COMMITED_READ_ONLY: number[];

    export interface TransactionOptions {
        /**
         * If unspecified a copy of `Firebird.DEFAULT_ISOLATION` will be used.
         */
        isolation?: number[];
        /**
         * @default - uses the target isolation settings
         */
        mode?: 'write' | 'read';
        /**
         * false    -> no_rec_version   - the most recent commited state of database will be used
         * true     -> rec_version      - a snapshot representing the state of the db upon transaction start.
         */
        rec?: boolean;
        /**
         * Sets the appropriate flag to the wait mode.
         * @default - uses the target isolation settings
         */
        wait?: boolean;
        /**
         * Prescribes the maximum number of seconds that the transaction should wait when a lock conflict occurs
         * Requires transactions with `wait: true`
         *
         * @default Waits for locking resource to be released (may take forever to happen so be careful)
         */
        lockTimeout?: number;
    }
    // export type Isolation = number[] | TransactionOptions;

    export class Isolation {
        /**
         * Isolation configuration.
         * @typedef {number[] | TransactionOptions} Config
         * @property {number[]} [isolation] - If unspecified, a copy of `Firebird.DEFAULT_ISOLATION` will be used.
         * @property {'write' | 'read'} [mode] - @default Uses the target isolation settings.
         * @property {boolean} [rec] - false: no_rec_version - the most recent committed state of the database will be used.
         *                              true: rec_version - a snapshot representing the state of the db upon transaction start.
         * @property {boolean} [wait] - Sets the appropriate flag to the wait mode. @default Uses the target isolation settings.
         * @property {number} [lockTimeout] - Prescribes the maximum number of seconds that the transaction should wait when a lock conflict occurs.
         *                                    Requires transactions with `wait: true`. @default Waits 5s - if resource is not locked during this time it will cause a DEADLOCK
         *
         * @param {Config} isolationOrOptions - The configuration for the transaction, either an array of numbers or a TransactionOptions object.
         * @returns {Config} The configuration used for the transaction.
         */
        constructor(isolationOrOptions: number[] | TransactionOptions);

        isolation: number[];
        mode: 'write' | 'read';
        rec: boolean;
        wait: boolean;
        lockTimeout: number | null;
    }

    export interface Database {
        detach(callback?: SimpleCallback): void;
        transaction(isolation: Isolation, callback: TransactionCallback): void;
        query(query: string, params: any[], callback: QueryCallback): void;
        execute(query: string, params: any[], callback: QueryCallback): void;
        sequentially(query: string, params: any[], rowCallback: SequentialCallback, callback: SimpleCallback, asArray?: boolean): void;
    }

    export interface Transaction {
        query(query: string, params: any[], callback: QueryCallback): void;
        execute(query: string, params: any[], callback: QueryCallback): void;
        commit(callback?: SimpleCallback): void;
        rollback(callback?: SimpleCallback): void;
        sequentially(query: string, params: any[], rowCallback: SequentialCallback, callback: SimpleCallback, asArray?: boolean): void;
    }

    //https://github.com/hgourvest/node-firebird/commit/999f5399c32e7364c5d32fe9e1228d37b943f2a4
    export type SupportedCharacterSet = |
        'NONE' |
        'CP943C' |
        'DOS737' |
        'DOS775' |
        'DOS858' |
        'DOS862' |
        'DOS864' |
        'DOS866' |
        'DOS869' |
        'GB18030' |
        'GBK' |
        'ISO8859_2' |
        'ISO8859_3' |
        'ISO8859_4' |
        'ISO8859_5' |
        'ISO8859_6' |
        'ISO8859_7' |
        'ISO8859_8' |
        'ISO8859_9' |
        'ISO8859_13' |
        'KOI8R' |
        'KOI8U' |
        'TIS620' |
        'UTF8' |
        'WIN1255' |
        'WIN1256' |
        'WIN1257' |
        'WIN1258' |
        'WIN_1258';

    export interface Options {
        host?: string;
        port?: number;
        database?: string;
        user?: string;
        password?: string;
        lowercase_keys?: boolean;
        role?: string;
        pageSize?: number;
        encoding?: SupportedCharacterSet;
    }

    export interface ConnectionPool {
        get(callback: DatabaseCallback): void;
        destroy(): void;
    }

    export function attach(options: Options, callback: DatabaseCallback): void;
    export function escape(value: string): string;
    export function create(options: Options, callback: DatabaseCallback): void;
    export function attachOrCreate(options: Options, callback: DatabaseCallback): void;
    export function pool(max: number,options: Options, callback: DatabaseCallback): ConnectionPool;

    export namespace promises {
        export function setDebug(debugFn: (...args) => any | void)
        export type ReadBlobEncoding = 'buffer' | 'utf8';
        export interface ReadBlobOpts {
            /**
             * @default: Buffer
             */
            encoding?: ReadBlobEncoding;
            /**
             * @default false
             */
            transliterate?: boolean;
        }
        export function readBlob<T extends ReadBlobOpts>(col, opts?: T): Promise< T['encoding'] extends 'utf8' ? string : Buffer>;
        export function transliterate<T extends boolean>(data: Buffer | string, returnAsBuff: T): T extends true ? Buffer : string;
        export class Db {
            constructor(db: any)
            query<T>(sql: string, params?: any[]): Promise<T>;
            detach(): void;
            transaction(isolation: any): Promise<promises.Transaction>;
            attachEvent(): Promise<any>;
            readBlob<T extends ReadBlobOpts>(col, opts?: T): Promise< T['encoding'] extends 'utf8' ? string : Buffer>;
        }
        export class PoolResult {
            // The original pool
            _pool: any;
            get: () => Promise<Db>
        }
        export function pool(max: number, options: Options): Promise<PoolResult>

        export class Pool {

        }
        export interface Transaction {
            constructor(tx: any);
            query<T>(sql: string, params?: any[]): Promise<T>;
            execute<T>(sql: string, params?: any[]): Promise<T>;
            commit(): Promise<void>;
            commitRetaining(): Promise<void>;
            rollback(options?: { resolveError?: boolean }): Promise<void>;
            rollbackRetaining(options?: { resolveError?: boolean }): Promise<void>;
            readBlob<T extends ReadBlobOpts>(col, opts?: T): Promise< T['encoding'] extends 'utf8' ? string : Buffer>;
            /**
             * @default: 'auto' -> latest isolation is used otherwise defaults to READ_ONLY isolation
             * @param isolation
             */
            restart(isolation?: 'auto' | any): Promise<void>;
        }

        export function attach(options?: Options): Promise<Db>;
    }
}
