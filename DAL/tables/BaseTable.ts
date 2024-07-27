import uuid from "react-native-uuid";
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

    constructor({ name, type, notNull, table, pk, fk, default_, }: { name: string, type: string, notNull?: boolean, table?: typeof BaseTable, pk?: boolean, fk?: Field, default_?: () => any }) {
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

    public get isFK(): boolean {
        return !!this._fk
    }

    public getDefinition(): string {
        let fk = this._fk ? `, FOREIGN KEY (${this._name}) REFERENCES ${this._fk!._table!.tableName}(${this._fk!._name})` : '';
        return `${this._name}${this._pk ? ' PRIMARY KEY' : ''}${this._notNull ? ' NOT NULL' : ''}`;
    }

    public getFKDefinition(): string {
        return `FOREIGN KEY (${this._name}) REFERENCES ${this._fk!._table!.tableName}(${this._fk!._name})`;
    }

    public getDefault() {
        return this._default?.();
    }

    public eq<T>(value: T): [string, T] {
        return [`${this._table!.tableName}.${this._name} = ?`, value]
    }

    public neq<T>(value: T): [string, T] {
        return [`${this._table!.tableName}.${this._name} != ?`, value]
    }

    public like(value: string): [string, string] {
        return [`${this._table!.tableName}.${this._name} LIKE ?`, `%${value}%`]
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

    public static insert(data: { [key: string]: any }, db: SQLite.SQLiteDatabase): Promise<SQLite.SQLiteRunResult> {
        let values: [string, any][] = this.fields.map(field => {
            return [field.name, data[field.name] || field.getDefault()]
        })
        return db.runAsync(
            `INSERT INTO ${this.tableName} (${values.map(v => v[0]).join(', ')}) VALUES (${new Array(values.length).fill('?').join(", ")});`,
            values.map(v => v[1])
        )
    }

    public static insertFromEntity(obj: Entity): Promise<SQLite.SQLiteRunResult> {
        return this.insert(obj, obj.getDAL().db!);
    }

    public static toEntity(data: { [key: string]: any } ): Entity {
        return new Entity({id: data["id"]});
    }

    public static filter(filters: [string, any][], select?: Field[]): [string, any[]] {
        filters.push(["1", 1]); // in the case the filters are empty
        return [
            `SELECT ${select ? select.map(f => f.name).join(", ") : "*"} FROM ${this.tableName} WHERE ${filters.map(f => f[0]).join(' AND ')}`,
            filters.map(f => f[1])
        ]
    }

    public static createTable(db: SQLite.SQLiteDatabase): Promise<void> {
        let fields = this.fields.map(f => f.getDefinition()).join(", ");
        let fk = this.fields.filter(f => f.isFK).map(f => f.getFKDefinition()).join(", ");
        if (fk) {
            fk = ", " + fk;
        }
        return db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (${fields}${fk});
        `);
    }

    public static getDefaultFields(): Field[] {
        return [
            new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
            new Field({ name: "created_at", type: "INTEGER",  default_: Date.now, notNull: true }),
            new Field({ name: "updated_at", type: "INTEGER",  default_: Date.now, notNull: true }),
            new Field({ name: "deleted_at", type: "INTEGER", default_: () => undefined }),
        ]
    }

}