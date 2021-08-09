const DB = require('../lib/db/postgres');
const path = require('path');
let reqPath = path.join(__dirname, '../');
const { default: i18n } = require('new-i18n');
const newi18n = new i18n(path.join(reqPath, process.env.Sprache), ["de"], "de");

console.log("All Systems Running!")

const Telebot = require('telebot');
const bot = new Telebot({
	token: process.env.TG_BotToken,
	limit: 1000,
        usePlugins: ['commandButton', 'askUser']
});

