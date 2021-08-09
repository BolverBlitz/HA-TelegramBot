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
    r smallint,
    g smallint,
    b smallint,
    w smallint,
    plugid smallint,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`, (err, result) => {
    if (err) {console.log(err)}
});