require('dotenv').config();
const express = require('express');
const fs = require('fs');
const DB = require('../../lib/db/postgres');

const PluginName = "UptimeRobot";
const PluginRequirements = [];
const PluginVersion = "0.0.2";
const PluginAuthor = "BolverBlitz";
const PluginDocs = "Privat";

const router = express.Router();

router.get("/", (reg, res) => {
    res.status(401)
    res.json({ message: "Application token is required!" });
});

router.get("/:Token", (reg, res) => {
    DB.get.controler.ByID(reg.params.Token).then(function (Controler) {
        if (Controler[0].rgbw_support === true) {
            if (Controler[0].mode === "White") {
                res.status(200)
                res.json({ r: 0, g: 0, b: 0, w: Controler[0].w });
            } else {
                res.status(200)
                res.json({ r: Controler[0].r, g: Controler[0].g, b: Controler[0].b, w: 0 });
            }
        } else {
            if (Controler[0].mode === "White") {
                let SaveWhite = 0
                if (Number(Controler[0].w) >= 150) {
                    SaveWhite = 150;
                } else {
                    SaveWhite = Controler[0].w;
                }
                res.status(200)
                res.json({ r: SaveWhite, g: SaveWhite, b: SaveWhite });
            } else {
                res.status(200)
                res.json({ r: Controler[0].r, g: Controler[0].g, b: Controler[0].b });
            }
        }
    });
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
    PluginAuthor: PluginAuthor,
    PluginDocs: PluginDocs
};