const CacheEngine = {
    store: {},
    /**
     * @param {String} key 
     * @returns 
     */
    get(key) {
        return this.store[key];
    },
    /**
     * @param {String} key 
     * @param {*} value 
     * @returns 
     */
    set(key, value) {
        this.store[key] = value;
    },
    /**
     * @param {String} key 
     * @returns {void}
     */
    delete(key) {
        delete this.store[key];
    },
    /**
     * @param {String} key 
     * @returns {Boolean}
     */
    has(key) {
        return this.store.hasOwnProperty(key);
    },
    /**
     * @param {String} key 
     * @returns {void}
     */
    log(key) {
        console.log(this.store[key]);
    },
    /**
     * @returns {void}
     */
    clear() {
        this.store = {};
    },
    /**
     * @returns {*}
     */
    keys() {
        return Object.keys(this.store);
    },
    /**
     * @returns {*}
     */
    values() {
        return Object.values(this.store);
    },
    /**
     * @returns {Number}
     */
    entries() {
        return Object.entries(this.store);
    },
    /**
     * @param {String} key_name
     * @param {String} value_name
     * @param {Array} data
     * @returns {Void}
     */
    set_data(key_name, value_name, data) {
        for(let i = 0; i < data.length; i++) {
            this.set(data[i][key_name], data[i][value_name]);
        }
    }
}

module.exports = CacheEngine;