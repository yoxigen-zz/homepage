(function(){
    angular.module("Storage", []).factory('Storage', ["$injector", function ($injector) {
        return function(id) { return $injector.instantiate(Storage, { id: id }); };
    }]);

    function Storage(id){
        // Make sure this Storage is unique, to avoid conflicts between two storage users:
        this.registerId(id);
        this.id = id;

        this.__defineGetter__("local", function(){
            if (this.localStorageApi)
                return this.localStorageApi;

            this.localStorageApi = new StorageApi(id, localStorage);
            return this.localStorageApi;
        });

        this.__defineGetter__("session", function(){
            if (this.sessionStorageApi)
                return this.sessionStorageApi;

            this.sessionStorageApi = new StorageApi(id, sessionStorage);
            return this.sessionStorageApi;
        });
    }

    Storage.prototype = (function(){
        var registeredIds = {};

        return {
            destroy: function(){
                delete registeredIds[this.id];
                this.id = null;
            },
            registerId: function(id){
                if (registeredIds[id])
                    throw new Error("Can't initiate Storage with ID " + id + ". A storage with this ID already exists.");

                registeredIds[id] = true;
            }
        };
    })();

    function StorageApi(id, storage){
        this.storage = storage;
        this.getStorageKeyName = function(key){
            return [id, key].join("_");
        };

        this.getStorageKeyPrefixRegExp = function(){
            new RegExp("^" + id + "_");
        };
    };

    StorageApi.prototype = {
        getItem: function(key){
            var storageData = this.storage.getItem(this.getStorageKeyName(key));
            return storageData ? JSON.parse(storageData).data : null;
        },
        setItem: function(key, data){
            this.storage.setItem(this.getStorageKeyName(key), JSON.stringify({ data: data }));
        },
        removeItem: function(key){
            this.storage.removeItem(this.getStorageKeyName(key));
        },
        clear: function(){
            var storageKeyPrefixRegExp = this.getStorageKeyPrefixRegExp();

            for(var keyName in this.storage){
                if (storageKeyPrefixRegExp.test(keyName))
                    this.storage.removeItem(keyName);
            }
        }
    };
})();