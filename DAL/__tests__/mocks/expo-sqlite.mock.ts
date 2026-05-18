// sql.js shim that mirrors the expo-sqlite surface used by BaseTable and Query.
// Call createMockDatabase() once (async) then use the returned object synchronously.

let _sqlJsPromise: Promise<any> | null = null;

async function getSqlJs(): Promise<any> {
  if (!_sqlJsPromise) {
    // sql-asm.js is a pure-JS (no WASM) build — works in any Node environment.
    // Like sql-wasm.js, the factory function is async (returns a Promise).
    const initSqlJs = require('sql.js/dist/sql-asm.js');
    _sqlJsPromise = initSqlJs();
  }
  return _sqlJsPromise;
}

export interface MockDatabase {
  getFirstSync<T>(sql: string, args: any[]): T | null;
  getAllSync<T>(sql: string, args: any[]): T[];
  runAsync(sql: string, args: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  execAsync(sql: string): Promise<void>;
  /** Expose raw sql.js Database for direct SQL assertions in tests. */
  _raw: any;
}

function wrapSqlJs(rawDb: any): MockDatabase {
  return {
    getFirstSync<T>(sql: string, args: any[] = []): T | null {
      try {
        const stmt = rawDb.prepare(sql);
        if (args.length > 0) stmt.bind(args);
        const hasRow = stmt.step();
        const row = hasRow ? { ...stmt.getAsObject() } : null;
        stmt.free();
        return row as T | null;
      } catch (e) {
        console.error('getFirstSync error:', sql, e);
        return null;
      }
    },

    getAllSync<T>(sql: string, args: any[] = []): T[] {
      try {
        const stmt = rawDb.prepare(sql);
        if (args.length > 0) stmt.bind(args);
        const rows: T[] = [];
        while (stmt.step()) {
          rows.push({ ...stmt.getAsObject() } as T);
        }
        stmt.free();
        return rows;
      } catch (e) {
        console.error('getAllSync error:', sql, e);
        return [];
      }
    },

    async runAsync(sql: string, args: any[] = []) {
      try {
        // sql.js throws on undefined params — map to null (SQL NULL).
        const safeArgs = args.map((v) => (v === undefined ? null : v));
        rawDb.run(sql, safeArgs);
        const idStmt = rawDb.prepare('SELECT last_insert_rowid() as id');
        idStmt.step();
        const lastInsertRowId = Number(idStmt.getAsObject().id ?? 0);
        idStmt.free();
        const changes = rawDb.getRowsModified();
        return { lastInsertRowId, changes };
      } catch (e) {
        console.error('runAsync error:', sql, e);
        throw e;
      }
    },

    async execAsync(sql: string) {
      try {
        rawDb.exec(sql);
      } catch (e) {
        console.error('execAsync error:', sql, e);
        throw e;
      }
    },

    _raw: rawDb,
  };
}

export async function createMockDatabase(): Promise<MockDatabase> {
  const SQL = await getSqlJs();
  return wrapSqlJs(new SQL.Database());
}

// Jest module mock exports (satisfy `import * as SQLite from 'expo-sqlite'`).
export async function openDatabaseAsync(_name: string): Promise<MockDatabase> {
  return Promise.resolve(createMockDatabase());
}
