// src/lib/db.js
// Unified database access — works on Vercel and locally
//
// Uses pg Pool with a tagged template interface compatible with neon().
// Supports fragment composition: sql`... ${condition ? sql`AND x = ${v}` : sql``} ...`

import pg from 'pg';

let _pool = null;

function getPool() {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL || process.env.NILE_DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL or NILE_DATABASE_URL must be set');
    }
    _pool = new pg.Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false }
    });
    // Prevent unhandled 'error' events from crashing the process
    _pool.on('error', (err) => {
      console.error('Database pool error:', err.message);
    });
  }
  return _pool;
}

/**
 * Internal query object — acts as both a Promise (when awaited) and a
 * composable SQL fragment (when interpolated inside another sql``).
 */
class SqlQuery {
  constructor(text, values) {
    this.text = text;
    this.values = values;
    this._promise = null;
  }

  then(resolve, reject) {
    if (!this._promise) {
      this._promise = getPool().query(this.text, this.values).then(res => res.rows);
    }
    return this._promise.then(resolve, reject);
  }

  catch(reject) {
    return this.then(undefined, reject);
  }
}

/**
 * Tagged template SQL function — compatible with neon()'s interface.
 *
 * Supports both direct queries and composable fragments:
 *   await sql`SELECT * FROM users WHERE id = ${id}`
 *   sql`... ${active ? sql`AND active = ${true}` : sql``} ...`
 *
 * Returns a thenable SqlQuery — await it to execute and get rows.
 */
export function sql(strings, ...values) {
  let text = '';
  let params = [];
  let paramIdx = 1;

  strings.forEach((str, i) => {
    text += str;
    if (i < values.length) {
      const val = values[i];
      if (val instanceof SqlQuery) {
        // Inline the fragment, remapping its parameter indices
        let fragText = val.text;
        let fragOffset = 0;
        fragText = fragText.replace(/\$(\d+)/g, () => {
          params.push(val.values[fragOffset++]);
          return `$${paramIdx++}`;
        });
        text += fragText;
      } else {
        text += `$${paramIdx++}`;
        params.push(val);
      }
    }
  });

  return new SqlQuery(text, params);
}
