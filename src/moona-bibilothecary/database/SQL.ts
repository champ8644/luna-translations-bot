/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import { Pool, QueryResult, QueryResultRow } from 'pg';

import { POSTGRES_DATABASE_URL } from '../config/secrets';

// export function query<R extends QueryResultRow = any, I extends any[] = any[]>(
//   queryText: string,
//   values?: I
// ): Promise<QueryResult<R>> {
//   return new Promise((resolve, reject) => {
//     const client = new Pool({
//       connectionString: POSTGRES_DATABASE_URL,
//       ssl: {
//         rejectUnauthorized: false,
//       },
//     });
//     client.connect();
//     if (values)
//       client.query<R>(queryText, values, (err, res) => {
//         if (err) reject(err);
//         else resolve(res);
//         client.end();
//       });
//     else
//       client.query<R>(queryText, (err, res) => {
//         if (err) reject(err);
//         else resolve(res);
//         client.end();
//       });
//   });
// }

// export function rangeSQL(startAt: number, amount: number) {
//   return (
//     "(" +
//     _.range(startAt, amount + 1)
//       .map((j) => `$${j}`)
//       .join(", ") +
//     ")"
//   );
// }

// export function selectFrom(
//   from: string,
//   columns?: Array<string>,
//   criteria?: string,
//   payload?: Array<any>
// ) {
//   const columnsText = columns ? rangeSQL(1, columns.length) : "*";
//   let queryText = `SELECT ${columnsText} FROM ${from}`;
//   if (criteria) queryText += ` WHERE ${criteria}`;
//   return query(queryText, [...(columns || []), ...(payload || [])]);
// }

// export async function selectFromEqual(
//   from: string,
//   columns: Array<string> | undefined,
//   _payload: Record<string, any>
// ) {
//   const payload = _.omitBy(_payload, _.isUndefined);
//   const columnsText = columns ? rangeSQL(1, columns.length) : "*";
//   const criteriaText = _.keys(payload)
//     .map((each, idx) => `"${each}"=$${idx + (columns?.length || 0) + 1}`)
//     .join(" AND ");
//   const queryText = `SELECT ${columnsText} FROM ${from} WHERE ${criteriaText}`;
//   return query(queryText, [...(columns || []), ...(_.values(payload) || [])]);
// }

// export async function deleteFromEqual(
//   from: string,
//   _payload: Record<string, any>
// ) {
//   const payload = _.omitBy(_payload, _.isUndefined);
//   const criteriaText = _.keys(payload)
//     .map((each, idx) => `"${each}"=$${idx + 1}`)
//     .join(" AND ");
//   const queryText = `DELETE FROM ${from} WHERE ${criteriaText}`;
//   return query(queryText, _.values(payload));
// }

// export function selectCount(
//   from: string,
//   column: string,
//   criteria?: string,
//   payload?: Array<any>
// ) {
//   let queryText = `SELECT Count(${column}) FROM ${from}`;
//   if (criteria) queryText += ` WHERE ${criteria}`;
//   return query(queryText, payload);
// }

// export function insertInto(
//   table: string,
//   column: Array<string>,
//   _payload: Record<string, any> | Array<Record<string, any>>
// ) {
//   let queryText =
//     `INSERT INTO ${table} (` +
//     column.map((x) => '"' + x + '"').join(", ") +
//     ") VALUES ";
//   let values: Array<any> = [];
//   if (_.isArray(_payload)) {
//     const payload = _payload;
//     queryText += _.range(0, payload.length)
//       .map(
//         (i) =>
//           "(" +
//           _.range(0, column.length)
//             .map((j) => `$${column.length * i + j + 1}`)
//             .join(", ") +
//           ")"
//       )
//       .join(", ");
//     values = _.flatten(payload.map((row) => column.map((key) => row[key])));
//   } else {
//     const payload = _.omitBy(_payload, _.isUndefined);
//     queryText += rangeSQL(1, column.length);
//     values = column.map((key) => payload[key]);
//   }
//   return query(queryText, values);
// }

class SQLClass {
  queue: Array<Promise<any>> = [];
  pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: POSTGRES_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    this.pool.connect();
  }

  endConnection() {
    this.pool.end();
  }

  query<R extends QueryResultRow = any, I extends any[] = any[]>(
    queryText: string,
    values?: I
  ): Promise<QueryResult<R>> {
    const prom = new Promise<QueryResult<R>>(async (resolve, reject) => {
      await Promise.all(this.queue);
      this.queue.splice(0, this.queue.length);

      if (values)
        this.pool.query<R>(queryText, values, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      else
        this.pool.query<R>(queryText, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
    });
    this.queue.push(prom);
    return prom;
  }

  rangeSQL(startAt: number, amount: number) {
    return (
      "(" +
      _.range(startAt, amount + 1)
        .map((j) => `$${j}`)
        .join(", ") +
      ")"
    );
  }

  selectFrom(
    from: string,
    columns?: Array<string>,
    criteria?: string,
    payload?: Array<any>
  ) {
    const columnsText = columns ? this.rangeSQL(1, columns.length) : "*";
    let queryText = `SELECT ${columnsText} FROM ${from}`;
    if (criteria) queryText += ` WHERE ${criteria}`;
    return this.query(queryText, [...(columns || []), ...(payload || [])]);
  }

  async selectFromEqual(
    from: string,
    columns: Array<string> | undefined,
    _payload: Record<string, any>
  ) {
    const payload = _.omitBy(_payload, _.isUndefined);
    const columnsText = columns ? this.rangeSQL(1, columns.length) : "*";
    const criteriaText = _.keys(payload)
      .map((each, idx) => `"${each}"=$${idx + (columns?.length || 0) + 1}`)
      .join(" AND ");
    const queryText = `SELECT ${columnsText} FROM ${from} WHERE ${criteriaText}`;
    return this.query(queryText, [
      ...(columns || []),
      ...(_.values(payload) || []),
    ]);
  }

  toSQLArray(array: Array<string>) {
    return `(${array.map((x) => `"${x}"`).join(", ")})`;
  }

  async insertIntoUpdate(
    from: string,
    _payload: Record<string, any>,
    primaryKey: string
  ) {
    const payload = _.omitBy(_payload, _.isUndefined);
    const keys = _.keys(_payload);
    let queryText = `INSERT INTO ${from} ${this.toSQLArray(
      keys
    )} VALUES ${this.rangeSQL(
      1,
      keys.length
    )} ON CONFLICT ("${primaryKey}") DO UPDATE SET `;
    const args: Array<any> = _.values(_payload);
    queryText += _.reduce(
      payload,
      (state, val, key) => {
        if (key === primaryKey) return state;
        args.push(val);
        state.push(`"${key}"=$${args.length}`);
        return state;
      },
      [] as Array<string>
    ).join(", ");
    return this.query(queryText, args);
  }

  async updateWhere(
    from: string,
    _payload: Record<string, any>,
    _where: Record<string, any>
  ) {
    const payload = _.omitBy(_payload, _.isUndefined);
    const where = _.omitBy(_where, _.isUndefined);
    const args: Array<any> = [];
    let queryText = `UPDATE ${from}`;
    queryText +=
      " SET " +
      _.reduce(
        payload,
        (state, val, key) => {
          args.push(val);
          state.push(`"${key}"=$${args.length}`);
          return state;
        },
        [] as Array<string>
      ).join(", ");
    queryText +=
      " WHERE " +
      _.reduce(
        where,
        (state, val, key) => {
          args.push(val);
          state.push(`"${key}"=$${args.length}`);
          return state;
        },
        [] as Array<string>
      ).join(" AND ");
    console.log({ queryText, args });
    return this.query(queryText, args);
  }

  async deleteFromEqual(from: string, _payload: Record<string, any>) {
    const payload = _.omitBy(_payload, _.isUndefined);
    const criteriaText = _.keys(payload)
      .map((each, idx) => `"${each}"=$${idx + 1}`)
      .join(" AND ");
    const queryText = `DELETE FROM ${from} WHERE ${criteriaText}`;
    return this.query(queryText, _.values(payload));
  }

  selectCount(
    from: string,
    column: string,
    criteria?: string,
    payload?: Array<any>
  ) {
    let queryText = `SELECT Count(${column}) FROM ${from}`;
    if (criteria) queryText += ` WHERE ${criteria}`;
    return this.query(queryText, payload);
  }

  insertInto(
    table: string,
    column: Array<string>,
    _payload: Record<string, any> | Array<Record<string, any>>
  ) {
    let queryText =
      `INSERT INTO ${table} (` +
      column.map((x) => '"' + x + '"').join(", ") +
      ") VALUES ";
    let values: Array<any> = [];
    if (_.isArray(_payload)) {
      const payload = _payload;
      queryText += _.range(0, payload.length)
        .map(
          (i) =>
            "(" +
            _.range(0, column.length)
              .map((j) => `$${column.length * i + j + 1}`)
              .join(", ") +
            ")"
        )
        .join(", ");
      values = _.flatten(payload.map((row) => column.map((key) => row[key])));
    } else {
      const payload = _.omitBy(_payload, _.isUndefined);
      queryText += this.rangeSQL(1, column.length);
      values = column.map((key) => payload[key]);
    }
    return this.query(queryText, values);
  }
}

const SQL = new SQLClass();
export default SQL;
