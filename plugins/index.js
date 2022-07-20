const fs = require('fs');

let plugins_enabled = [];
let Plugins_disabled = [];
let iimport;

Array.prototype.remove = function () {
    let what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

fs.readdir("./plugins", function (err, filenames) {
    filenames.remove('index.js');
    for (i = 0; i < filenames.length; i++) {
        if (filenames[i].startsWith("disabled.") || process.env[`P_${filenames[i].replace("disabled.", "").replace(".js", "")}`] !== "true") {
            Plugins_disabled.push(filenames[i].replace("disabled.", "").replace(".js", ""));
        } else {
            iimport = require(`./${filenames[i]}`);
            plugins_enabled.push(filenames[i].replace(".js", ""));
        }
    }

    console.log(`Plugins enabled: ${plugins_enabled}\nPlugins disabled: ${Plugins_disabled}`);
});