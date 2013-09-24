(function(){
    angular.module("Storage", ["Parse"]).factory('Storage', ["$injector", "$q", "$rootScope", "parse", function ($injector, $q, $rootScope, parse) {
        function Storage(id, options){
            // Make sure this Storage is unique, to avoid conflicts between two storage users:
            this.options = options || {};
            this.registerId(id, this.options.reuseId);
            this.id = id;

            this.__defineGetter__("local", function(){
                if (this.localStorageApi)
                    return this.localStorageApi;

                this.localStorageApi = new AsyncLocalStorage(id);
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

                this.cloudStorageApi = new ParseStorage(id);
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
                registerId: function(id, reuseId){
                    if (registeredIds[id] && !reuseId)
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

            this.storageKeyPrefixRegExp = function(){
                return new RegExp("^" + id + "_");
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

        function ParseStorage(id){
            this.getParseClassName = function(key){
                return id + (key ? "_" + key : "");
            };
        }

        ParseStorage.prototype = {
            getItem: function(key, options){
                var self = this,
                    deferred = $q.defer();

                options = options || {};

                if (options.forCurrentUser !== false && parse.getCurrentUser())
                    parse.get(this.getParseClassName(key), options).then(function(results){
                        if (results.length){
                            deferred.resolve(results[0]);
                        }
                        else
                            deferred.resolve(null);
                    }, function(error){
                        deferred.reject(error);
                    });
                else{
                    deferred.resolve();
                }

                return deferred.promise;
            },
            query: function(constrains, options){
                return parse.query(this.getParseClassName(), constrains, options);
            },
            removeItem: function(key, options){
                console.error("NOT DEFINED remove item yet");
            },
            setItem: function(key, data, options){
                return parse.save(this.getParseClassName(key), data, options);
            }
        };

        function AsyncLocalStorage(id){
            this.getStorageKeyName = function(key){
                return [id, key].join("_");
            };

            this.storageKeyPrefixRegExp = new RegExp("^" + id + "_");
        }

        AsyncLocalStorage.prototype = {
            getItem: function(key){
                return this.getItems([this.getStorageKeyName(key)]);
            },
            getItems: function(keys){
                var deferred = $q.defer(),
                    items = {},
                    self = this;

                angular.forEach(keys, function(key){
                    var storageValue = localStorage.getItem(key);
                    if (storageValue !== null){
                        items[key.replace(self.storageKeyPrefixRegExp, "")] = JSON.parse(storageValue).data;
                    }
                });

                setTimeout(function(){
                    $rootScope.safeApply(function(){
                        if (!Object.keys(items).length)
                            deferred.resolve();
                        else{
                            if (keys.length === 1)
                                deferred.resolve(items[keys[0].replace(self.storageKeyPrefixRegExp, "")]);
                            else
                                deferred.resolve(items);
                        }
                    })
                });
                return deferred.promise;
            },
            setItem: function(key, data){
                var deferred = $q.defer();

                localStorage.setItem(this.getStorageKeyName(key), JSON.stringify({ data: data }));
                deferred.resolve();

                return deferred.promise;
            },
            removeItem: function(key){
                var deferred = $q.defer();
                localStorage.removeItem(this.getStorageKeyName(key));
                deferred.resolve();
                return deferred.promise;
            },
            clear: function(){
                var deferred = $q.defer();
                for(var storageKey in localStorage){
                    if (this.storageKeyPrefixRegExp.test(storageKey)){
                        localStorage.removeItem(storageKey);
                    }
                }

                deferred.resolve();
                return deferred.promise;
            }
        };

        function ChromeStorageApi(id, storage){
            this.storage = storage;

            this.getStorageKeyName = function(key){
                return [id, key].join("_");
            };

            this.getStorageKeyPrefixRegExp = function(){
                new RegExp("^" + id + "_");
            };
        }

        ChromeStorageApi.prototype = {
            getItem: function(key){
                return this.getItems([this.getStorageKeyName(key)]);
            },
            getItems: function(keys){
                var deferred = $q.defer(),
                    self = this;

                this.storage.get(keys, function(data){
                    if (!Object.keys(data).length)
                        deferred.resolve();
                    else{
                        if (keys.length === 1)
                            deferred.resolve(data[keys[0]]);
                        else
                            deferred.resolve(data);
                    }

                    $rootScope.$apply();
                });

                return deferred.promise;
            },
            setItem: function(key, data){
                var deferred = $q.defer(),
                    obj = {},
                    self = this;

                obj[this.getStorageKeyName(key)] = data;

                this.storage.set(obj, function(){
                    deferred.resolve();
                    $rootScope.$apply();
                });

                return deferred.promise;
            },
            removeItem: function(key){
                var deferred = $q.defer(),
                    self = this;

                this.storage.remove(this.getStorageKeyName(key), function(){
                    deferred.resolve();
                    $rootScope.$apply();
                });

                return deferred.promise;
            },
            clear: function(){
                var deferred = $q.defer(),
                    self = this;

                this.storage.clear(function(){
                    deferred.resolve();
                    $rootScope.$apply();
                });

                return deferred.promise;
            }
        };
        
        return function(id, options) { return $injector.instantiate(Storage, { id: id, options: options }); };
    }]);
})();