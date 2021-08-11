const pg = require('pg');

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

pool.query(`CREATE TABLE IF NOT EXISTS uuser (
    userid bigint PRIMARY KEY,
    username text,
    admin boolean DEFAULT False,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`, (err, result) => {
    if (err) {console.log(err)}
});

pool.query(`CREATE TABLE IF NOT EXISTS plugs (
    plugid serial PRIMARY KEY,
    name text,
    ipaddr inet,
    watt double precision,
    kwh_today double precision,
    state boolean DEFAULT True,
    state_switch_allowed boolean DEFAULT True,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`, (err, result) => {
    if (err) {console.log(err)}
});

pool.query(`CREATE TABLE IF NOT EXISTS rbgcontroler (
    controlerid serial PRIMARY KEY,
    name text,
    ipaddr inet,
    mode text,
    rgbw_support boolean,
    r smallint,
    g smallint,
    b smallint,
    w smallint,
    plugid smallint,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`, (err, result) => {
    if (err) {console.log(err)}
});

/**
 * This function will return all plugs
 * @returns Array
 */
 let GetAllPlugs = function() {
    return new Promise(function(resolve, reject) {
      pool.query('SELECT * FROM plugs ORDER BY plugid', (err, result) => {
        if (err) {reject(err)}
        resolve(result.rows);
      });
    });
  }

/**
 * This function will return a plug by id
 * @param {Number} PlugID
 * @returns Array
 */
 let GetByIDPlugs = function(PlugID) {
    return new Promise(function(resolve, reject) {
      pool.query('SELECT * FROM plugs WHERE plugid = $1',[
          PlugID
        ], (err, result) => {
        if (err) {reject(err)}
        resolve(result.rows);
      });
    });
  }

/**
 * This function will update watt, kwh and state of a plug by ID
 * @param {Number} PlugID
 * @param {Number} Watt
 * @param {Number} KWH
 * @param {Boolean} State
 * @returns Array
 */
let UpdatePlugsPower = function(PlugID, Watt, KWH, State) {
    return new Promise(function(resolve, reject) {
      pool.query('UPDATE plugs SET watt = $2, kwh_today = $3, state = $4 WHERE plugid = $1',[
          PlugID, Watt, KWH, State
        ], (err, result) => {
        if (err) {reject(err)}
        resolve(result);
      });
    });
}

/**
 * This function will update the state of a plug by ID
 * @param {Number} PlugID
 * @param {Boolean} State
 * @returns Array
 */
 let UpdatePlugsState = function(PlugID, State) {
    return new Promise(function(resolve, reject) {
      pool.query('UPDATE plugs SET state = $2 WHERE plugid = $1',[
          PlugID, State
        ], (err, result) => {
        if (err) {reject(err)}
        resolve(result);
      });
    });
}

let get = {
    plugs: {
        All: GetAllPlugs,
        ByID: GetByIDPlugs
    }
}

let update = {
    plugs: {
        UpdatePower: UpdatePlugsPower,
        UpdateState: UpdatePlugsState
    }
}

module.exports = {
    get,
    update
};