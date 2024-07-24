import * as SQLite from 'expo-sqlite';
import { Entity } from '../entities/BaseEntity';

export class Field {
    protected _name: string;
    protected _type: string;
    protected _notNull?: boolean;
    protected _table?: typeof BaseTable;
    protected _pk?: boolean;
    protected _fk?: Field;
    protected _default?: () => any;

    constructor({name, type, notNull, table, pk, fk, default_, }: {name: string, type: string, notNull?: boolean, table?: typeof BaseTable, pk?: boolean, fk?:Field, default_?: () => any}) {
        this._name = name;
        this._type = type;
        this._notNull = notNull;
        this._table = table;
        this._pk = pk;
        this._fk = fk;
        this._default = default_;
    }

    public setTable(table: typeof BaseTable) {
        this._table = table;
    }

    public get name(): string {
        return this._name
    }

    public getDefinition(): string {
        let fk = this._fk ? `, FOREIGN KEY (${this._name}) REFERENCES ${this._fk!._table!.tableName}(${this._fk!._name}),` : '';
        return `${this._name}${this._pk ? ' PRIMARY KEY': ''}${this._notNull ? ' NOT NULL': ''}${fk}`;
    }

    public getDefault() {
        return this._default?.();
    }

    public eq<T>(value: T): [string, T] {
        return [`${this._table!.tableName} = ?`, value]
    }

    public neq<T>(value: T): [string, T] {
        return [`${this._table!.tableName} != ?`, value]
    }

}

export class BaseTable {
    public static tableName: string;
    public static fields: Field[];

    public static getField(name: string): Field | undefined {
        let field = this.fields.filter(f => f.name === name);
        if (field) {
            field[0].setTable(this);
            return field[0];
        }
    }

    public static insert(data: { [key: string]: any}, db: SQLite.SQLiteDatabase): Promise<SQLite.SQLiteRunResult> {
        let values: [string, any][] = this.fields.map(field => {
            return [field.name, data[field.name] || field.getDefault()]
        })
        return db.runAsync(
            `INSERT INTO ${this.tableName} (${values.map(v => v[0]).join(', ')}) VALUES (${'?, '.repeat(values.length)})`,
            values.map(v=>v[1])
        )
    }

    public static insertFromObj(obj: Entity): Promise<SQLite.SQLiteRunResult> {
        return this.insert(obj, obj.getDAL().db!);
    }

    public static createTable(db: SQLite.SQLiteDatabase): Promise<void> {
        let fields = this.fields.map(f => f.getDefinition()).join(", ")
        return db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (${fields});
        `);
    }


}