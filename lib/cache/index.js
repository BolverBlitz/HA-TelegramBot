const CacheEngine = {
    store: {},
    /**
     * Request a value from the cache
     * @param {String} key 
     * @returns 
     */
    get(key) {
        return this.store[key];
    },
    /**
     * Set a value in the cache
     * @param {String} key 
     * @param {*} value 
     * @returns 
     */
    set(key, value) {
        this.store[key] = value;
    },
    /**
     * Deletes a key from the cache
     * @param {String} key 
     * @returns {void}
     */
    delete(key) {
        delete this.store[key];
    },
    /**
     * Checks if the key is stored
     * @param {String} key 
     * @returns {Boolean}
     */
    has(key) {
        return this.store.hasOwnProperty(key);
    },
    /**
     * Will log the requested key to console
     * @param {String} key 
     * @returns {void}
     */
    log(key) {
        console.log(this.store[key]);
    },
    /**
     * Clears all data
     * @returns {void}
     */
    clear() {
        this.store = {};
    },
    /**
     * Returns all keys
     * @returns {Array}
     */
    keys() {
        return Object.keys(this.store);
    },
    /**
     * Returns all values
     * @returns {Array}
     */
    values() {
        return Object.values(this.store);
    },
    /**
     * Returns all entrys
     * @returns {Array}
     */
    entries() {
        return Object.entries(this.store);
    },
    /**
     * Returns the amount of stored keys
     * @returns {Number}
     */
    count() {
        return Object.keys(this.store).length;
    },
    /**
     * Stores one variable of a array of objects
     * @param {String} key_name
     * @param {String} value_name
     * @param {Array} data
     * @returns {Void}
     */
    set_data(key_name, value_name, data) {
        for(let i = 0; i < data.length; i++) {
            this.set(data[i][key_name], data[i][value_name]);
        }
    },
    /**
     * Stores a array of objects
     * @param {String} key_name 
     * @param {Array} data 
     * @returns {Void}
     */
    set_object(key_name, data) {
        for(let i = 0; i < data.length; i++) {
            delete data[i][key_name];
            this.set(data[i][key_name], data[i]);
        }
    }
}

module.exports = CacheEngine;