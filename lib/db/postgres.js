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
 * This function will check if a user exists and returns permissions
 * @param {Number} UserID
 * @returns Array
 */
 let CheckUserPermissions = function(UserID) {
  return new Promise(function(resolve, reject) {
    pool.query('SELECT admin FROM uuser WHERE userid = $1',[
      UserID
    ], (err, result) => {
      if (err) {reject(err)}
      resolve(result);
    });
  });
}

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

/**
 * This function will get all RGB Coltrolers
 * @returns Array
 */
 let GetAllCrontrolers = function() {
  return new Promise(function(resolve, reject) {
    pool.query('SELECT rbgcontroler.controlerid, rbgcontroler.name, rbgcontroler.ipaddr, rbgcontroler.mode, rbgcontroler.rgbw_support, rbgcontroler.r, rbgcontroler.g, rbgcontroler.g, rbgcontroler.w, rbgcontroler.plugid, plugs.state FROM rbgcontroler LEFT JOIN plugs ON rbgcontroler.plugid = plugs.plugid', (err, result) => {
      if (err) {reject(err)}
      resolve(result.rows);
    });
  });
}

/**
 * This function will return a controler by id
 * @param {Number} Controler
 * @returns Array
 */
 let GetByIDCrontrolers = function(Controler) {
  return new Promise(function(resolve, reject) {
    pool.query('SELECT * FROM rbgcontroler WHERE controlerid = $1',[
      Controler
      ], (err, result) => {
      if (err) {reject(err)}
      resolve(result.rows);
    });
  });
}

/**
 * This function will update a controler by id
 * @param {Number} Controler
 * @param {string} mode
 * @param {Array} RGB
 * @param {string} W
 * @returns Array
 */
 let UpdateControlerByID = function(Controler, mode, RGB, W) {
   if(!W){
      return new Promise(function(resolve, reject) {
        pool.query('UPDATE rbgcontroler SET mode = $2, r = $3, g = $4, b = $5 WHERE controlerid = $1',[
          Controler, mode, RGB[0], RGB[1], RGB[2]
          ], (err, result) => {
          if (err) {reject(err)}
          resolve(result);
        });
      });
    }else{
    return new Promise(function(resolve, reject) {
      pool.query('UPDATE rbgcontroler SET mode = $2, w = $3 WHERE controlerid = $1',[
        Controler, mode, W
        ], (err, result) => {
        if (err) {reject(err)}
        resolve(result);
      });
    });
  }
}

let get = {
    user: {
      check: {
        IsAdmin: CheckUserPermissions
      }
    },
    plugs: {
        All: GetAllPlugs,
        ByID: GetByIDPlugs
    },
    controler: {
      All: GetAllCrontrolers,
      ByID: GetByIDCrontrolers
    }
}

let update = {
    plugs: {
        UpdatePower: UpdatePlugsPower,
        UpdateState: UpdatePlugsState
    },
    controler: {
      ByID: UpdateControlerByID
    }
}

module.exports = {
    get,
    update
};