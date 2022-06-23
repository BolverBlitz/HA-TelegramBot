const express = require('express');
const DB = require('../../lib/db/postgres');
const Joi = require('joi');
const FAN_Controler_NameCache = require('../../lib/cache');
const { writeDatapoint } = require('../../lib/influx');

const PluginName = "TEMP_Collector";
const PluginRequirements = [];
const PluginVersion = "0.0.1";
const PluginAuthor = "BolverBlitz";
const PluginDocs = "Privat";

// Global Var to store when the last Datapoint was written
let LastTempLog = 0;

const UpdateCache = () => {
    return new Promise(function (resolve, reject) {
        DB.get.fan_controler.All().then(async (result) => {
            const fan_controler = result;

            FAN_Controler_NameCache.set_data("controlerid", "name", fan_controler);
            resolve();
        }).catch(err => {
            console.log(err);
            reject(err);
        });
    });
}

const temp_report = Joi.object({
    temp1: Joi.number().required(),
    temp2: Joi.number().required(),
    temp3: Joi.number().required(),
});

const router = express.Router();

router.get("/", (reg, res) => {
    res.status(401)
    res.json({ message: "Application token is required!" });
});

router.get("/:Token", async (reg, res, next) => {
    try {
        const data = await temp_report.validateAsync(reg.query);
        const Token = reg.params.Token;

        // If -127 is reported that means there is no sensor data, so we ignore it
        for (const [key, value] of Object.entries(data)) {
            if (value === -127) {
                delete data[key];
            }
        }

        //Check if Token is in cache
        if (FAN_Controler_NameCache.has(Token)) {
            const fan_controler_Name = FAN_Controler_NameCache.get(Token);
            if (LastTempLog + Number(process.env.LogTempretureInterval)*60*1000 < Date.now()) {
                writeDatapoint("Temp", data, fan_controler_Name);
                LastTempLog = Date.now();
            }
            res.status(200);
        } else {
            //If not, update cache and try again
            UpdateCache().then(() => {
                if (FAN_Controler_NameCache.has(Token)) {
                    const fan_controler_Name = FAN_Controler_NameCache.get(Token);
                    if (LastTempLog + process.env.LogTempretureInterval < Date.now()) {
                        writeDatapoint("Temp", data, fan_controler_Name);
                        LastTempLog = Date.now();
                    }
                    res.status(200);
                } else {
                    // Reject Token because it is not in cache
                    res.status(401);
                    res.json({ message: "Token is not valid!" });
                }
            });
        }
    } catch (error) {
        console.log(error)
        next(error);
    }
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
    PluginAuthor: PluginAuthor,
    PluginDocs: PluginDocs
};