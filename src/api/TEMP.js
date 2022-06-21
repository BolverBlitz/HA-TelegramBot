const express = require('express');
const DB = require('../../lib/db/postgres');
const Joi = require('joi');

const PluginName = "TEMP_Collector";
const PluginRequirements = [];
const PluginVersion = "0.0.1";
const PluginAuthor = "BolverBlitz";
const PluginDocs = "Privat";

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
        const value = await temp_report.validateAsync(reg.query);
        const Token = reg.params.Token;

        console.log(value);
    } catch (error) {
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