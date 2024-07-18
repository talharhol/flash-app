import * as SQLite from 'expo-sqlite';
import dalService from './DALService';



export async function runMigrations() {
    const db = await SQLite.openDatabaseAsync('flashLocalDB.db');
    let currentVersion = await getCurrentVersion(db);
    while (currentVersion < migrations.length) {
        await migrations[currentVersion](db)
        currentVersion += 1;
        alert("run migrtion")
    }
    await db.execAsync(`PRAGMA user_version = ${migrations.length}`);
    await dalService.connect();
}

async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
    let dbResult = await db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version'
    );
    return dbResult!.user_version;
}


const migrations = [
    async (db: SQLite.SQLiteDatabase) => {
        db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, image TEXT NOT NULL);
        `).catch(alert);
    },    
];
