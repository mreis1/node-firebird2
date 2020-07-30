// Type definitions for node-firebird 0.8.3
// Project: node-firebird
// Definitions by: Marco Warm <https://github.com/MarcusCalidus>

declare module 'node-firebird2' {
    type DatabaseCallback = (err: any, db: Database) => void;

    type TransactionCallback = (err: Options, transaction: Transaction) => void;
    type QueryCallback = (err: any, result: any[]) => void;
    type SimpleCallback = (err: any) => void;
    type SequentialCallback = (row: any, index: number, next: any) => void;

    export const ISOLATION_READ_UNCOMMITTED: number[];
    export const ISOLATION_READ_COMMITED: number[];
    export const ISOLATION_REPEATABLE_READ: number[];
    export const ISOLATION_SERIALIZABLE: number[];
    export const ISOLATION_READ_COMMITED_READ_ONLY: number[];

    export type Isolation = number[];

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

    export interface Options {
        host?: string;
        port?: number;
        database?: string;
        user?: string;
        password?: string;
        lowercase_keys?: boolean;
        role?: string;           
        pageSize?: number; 
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

    export namespace Fb2 {
        export class Db {
            constructor(db: any)
            query<T>(sql: string, params?: any[]): Promise<T>;
            detach(): void;
            transaction(isolation: any): Promise<Fb2.Transaction>;
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
            commit(): Promise<void>;
            rollback(): Promise<void>;
        }

        export function attach(options?: Options): Promise<Db>;
    }
}
