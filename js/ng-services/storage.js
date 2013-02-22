(function(){
    angular.module("Storage", []).factory('Storage', ["$injector", "$q", function ($injector, $q, $rootScope) {
        return function(id) { return $injector.instantiate(Storage, { id: id }); };
    }]);

    function Storage(id, $q, $rootScope){
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

        this.__defineGetter__("cloud", function(){
            if (this.cloudStorageApi)
                return this.cloudStorageApi;

            this.cloudStorageApi = new ChromeStorageApi(id, $q, $rootScope);
            return this.cloudStorageApi;
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

    function ChromeStorageApi(id, $q, $rootScope){
        this.$q = $q;
        this.$rootScope = $rootScope;

        this.getStorageKeyName = function(key){
            return [id, key].join("_");
        };

        this.getStorageKeyPrefixRegExp = function(){
            new RegExp("^" + id + "_");
        };
    }

    ChromeStorageApi.prototype = {
        getItem: function(key){
            return this.getItems([key]);
        },
        getItems: function(keys){
            var deferred = this.$q.defer(),
                self = this;

            chrome.storage.sync.get(keys, function(data){
                if (!Object.keys(data).length)
                    deferred.resolve();
                else{
                    if (keys.length === 1)
                        deferred.resolve(data[keys[0]]);
                    else
                        deferred.resolve(data);
                }

                self.$rootScope.$apply();
            });

            return deferred.promise;
        },
        setItem: function(key, data){
            var deferred = this.$q.defer(),
                obj = {},
                self = this;

            obj[key] = data;
            console.log("SETTING", obj)
            chrome.storage.sync.set(obj, function(){
                console.log("sync set: ", arguments, ", error: ", chrome.runtime.lastError);
                deferred.resolve();
                self.$rootScope.$apply();
            });

            return deferred.promise;
        },
        removeItem: function(key){
            var deferred = this.$q.defer(),
                self = this;

            chrome.storage.sync.remove(key, function(){
                deferred.resolve();
                self.$rootScope.$apply();
            });

            return deferred.promise;
        },
        clear: function(){
            var deferred = this.$q.defer(),
                self = this;

            chrome.storage.sync.clear(function(){
                deferred.resolve();
                self.$rootScope.$apply();
            });

            return deferred.promise;
        }
    };
})();