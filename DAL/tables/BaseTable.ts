import uuid from "react-native-uuid";
import * as SQLite from 'expo-sqlite';
import { Entity, EntityProps } from '../entities/BaseEntity';

export class Field {
    protected _name: string;
    protected _type: string;
    protected _notNull?: boolean;
    protected _table?: typeof BaseTable;
    protected _pk?: boolean;
    protected _fk?: Field;
    protected _alias: string;
    protected _default?: () => any;
    protected _loader?: (data: any) => any;
    protected _dumper?: (data: any) => any;

    constructor({ name, type, notNull, table, pk, fk, alias, default_, loader, dumper }: { name: string, type: string, notNull?: boolean, table?: typeof BaseTable, pk?: boolean, fk?: Field, alias?: string, default_?: () => any, loader?: (data: any) => any, dumper?: (data: any) => any; }) {
        this._name = name;
        this._type = type;
        this._notNull = notNull;
        this._table = table;
        this._pk = pk;
        this._fk = fk;
        this._alias = alias || name;
        this._default = default_;
        this._loader = loader;
        this._dumper = dumper;
    }

    public setTable(table: typeof BaseTable) {
        this._table = table;
    }

    public get name(): string {
        return this._name
    }

    public get alias(): string {
        return this._alias
    }

    public get isFK(): boolean {
        return !!this._fk
    }

    public Dump(data: { [key: string]: any }): any {
        let value = data[this._name];
        if (value === undefined) value = data[this._alias];
        if (value === undefined) value = this._default?.();
        if (this._dumper !== undefined) return this._dumper(value);
        return value;
    }

    public Load(value: any): any {
        if (this._loader !== undefined) return this._loader(value);
        return value;
    }

    public matchName(name: string): boolean {
        return this._name === name || this._alias === name;
    }

    public getDefinition(): string {
        return `${this._name}${this._pk ? ' PRIMARY KEY' : ''}${this._notNull ? ' NOT NULL' : ''}`;
    }

    public getFKDefinition(): string {
        return `FOREIGN KEY (${this._name}) REFERENCES ${this._fk!._table!.tableName}(${this._fk!._name}) ON DELETE CASCADE`;
    }

    public getDefault() {
        return this._default?.();
    }

    public toSQL() {
        return `${this._table!.tableName}.${this._name}`
    }

    public eq<T>(value: T): [string, T] {
        return [`${this.toSQL()} = ?`, value]
    }

    public neq<T>(value: T): [string, T] {
        return [`${this.toSQL()} != ?`, value]
    }

    public like(value: string): [string, string] {
        return [`${this.toSQL()} LIKE ?`, `%${value}%`]
    }

    public in<T>(value: T[]): [string, T[]] {
        return [`${this.toSQL()} IN (${new Array(value.length).fill('?').join(', ')})`, value]
    }

    public ge(value: number): [string, number] {
        return [`${this.toSQL()} >= ?`, value]
    }

    public notNull(): [string, []] {
        return [`${this.toSQL()} IS NOT NULL`, []]
    }

    public isNull(): [string, []] {
        return [`${this.toSQL()} IS NULL`, []]
    }
}

export class BaseTable {
    public static tableName: string;
    public static fields: Field[];
    public static entity: typeof Entity;


    public static getField(name: string): Field | undefined {
        let field = this.fields.filter(f => f.matchName(name));
        if (field.length > 0) {
            field[0].setTable(this);
            return field[0];
        }
        console.log(`table ${this.tableName} has no column ${name}`);
    }

    public static insert(data: { [key: string]: any }, db: SQLite.SQLiteDatabase): Promise<any> {
        let values: [string, any][] = this.fields.map(field => {
            return [field.name, field.Dump(data)]
        });
        return db.runAsync(
            `INSERT INTO ${this.tableName} (${values.map(v => v[0]).join(', ')}) VALUES (${new Array(values.length).fill('?').join(", ")});`,
            values.map(v => v[1])
        ).catch(console.log);
    }

    public static fromEntity(obj: Entity): { [key: string]: any } {
        let data = Object.assign<{}, { [key: string]: any }>({}, obj);
        delete data.dal
        delete data.setDAL
        Object.keys(data).map(k => {
            // removeing all unrelated data
            if (this.getField(k) === undefined) delete data[k];
        });
        return data
    }

    public static insertFromEntity(obj: Entity): Promise<SQLite.SQLiteRunResult> {
        return this.insert(this.fromEntity(obj), obj.getDAL().db!);
    }

    public static toEntity<EntityType extends Entity>(data: { [key: string]: any }, entityConstructor?: new (data: any) => EntityType): EntityType {
        let entityData: { [key: string]: any } = {};
        Object.keys(data).map(k => {
            entityData[this.getField(k)!.alias] = data[k];
        });
        if (entityConstructor === undefined) return new this.entity(entityData) as EntityType;
        return new entityConstructor(entityData);
    }

    public static filter(filters: [string, any][], select?: Field[]): [string, any[]] {
        filters.push(this.getField("deleted_at")!.isNull()); // make sure it isnt deleted 
        return [
            `SELECT ${select ? select.map(f => f.name).join(", ") : "*"} FROM ${this.tableName} WHERE ${filters.map(f => f[0]).join(' AND ')}`,
            filters.map(f => f[1]).flat(Infinity)
        ]
    }

    public static getFirst<T>(query: string, args: any[], db: SQLite.SQLiteDatabase): T {
        let result = db.getFirstSync<{ [ket: string]: any }>(query, args);
        if (result === null) {
            console.error(`Failed getting object! \nquery: ${query}\n args: ${args}`);
            return {} as T
        }
        let parsed: { [ket: string]: any } = {};
        Object.keys(result).map(k => {
            let field = this.getField(k)
            if (!field) console.log(`cant find column ${k} in table ${this.tableName}`);
            else parsed[k] = field.Load(result[k]);
        });
        return parsed as T;
    }

    public static getAll<T>(query: string, args: any[], db: SQLite.SQLiteDatabase): T[] {
        let results = db.getAllSync<{ [ket: string]: any }>(query, args);

        return results.map(r => {
            let parsed: { [ket: string]: any } = {};
            Object.keys(r).map(k => {
                let field = this.getField(k)
                if (!field) console.log(`cant find column ${k} in table ${this.tableName}`);
                else parsed[k] = field.Load(r[k]);
            });
            return parsed;
        }) as T[];
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
            new Field({ name: "created_at", type: "INTEGER", default_: Date.now, notNull: true }),
            new Field({ name: "updated_at", type: "INTEGER", default_: Date.now, notNull: true }),
            new Field({ name: "deleted_at", type: "INTEGER", default_: () => undefined }),
        ]
    }

    public static update(filters: [string, any][], data: { [key: string]: any }, db: SQLite.SQLiteDatabase) {
        filters.push(["1 = ?", 1]);
        let values: [string, any][] = Object.keys(data).map(
            k => {
                let field = this.getField(k)!;
                return [`${field.name} = ?`, field.Dump(data)]
            }
        )
        return db.runAsync(
            `UPDATE ${this.tableName} 
            SET ${values.map(v => v[0]).join(', ')} 
            WHERE ${filters.map(f => f[0]).join(' AND ')}`,
            [
                ...values.map(v => v[1]),
                ...filters.map(f => f[1]).flat(Infinity)
            ]
        ).catch(console.log)
    }

    public static delete(filters: [string, any][], db: SQLite.SQLiteDatabase) {
        filters.push(["1 = ?", 1]);
        return db.runAsync(
            `DELETE FROM ${this.tableName} WHERE ${filters.map(f => f[0]).join(' AND ')}`,
            filters.map(f => f[1]).flat(Infinity)
        ).catch(console.log)
    }

}