(function(){
    angular.module("Cache", ["Storage"]).factory('Cache', ["$injector", "$q", "Storage", function ($injector, $q, Storage) {
        return function(options) { return $injector.instantiate(Cache, { options: options }); };
    }]);

    function Cache($rootScope, $q, Storage, options){
        this.$rootScope = $rootScope;
        this.$q = $q;
        this.options = options || {};
        this.data = {};
        this.storage = new Storage("cache_" + options.id).local;
        this.__defineGetter__("id", function(){ return options.id; });
    };

    Cache.prototype = {
        getItem: function(keyName, options){
            var deferred = this.$q.defer(),
                self = this;

            this.storage.getItem(keyName).then(function(dataObj){
                if (dataObj){
                    if (dataObj.expires && dataObj.expires < new Date().valueOf()){
                        self.removeItem(keyName);
                        deferred.resolve(null);
                    }
                    else{
                        var data = dataObj && dataObj.data;

                        if (options && options.hold)
                            self.data[keyName] = data;

                        deferred.resolve(data);
                    }
                }
                else
                    deferred.resolve(dataObj);
            });

            return deferred.promise;
        },
        removeItem: function(keyName){
            this.storage.removeItem(keyName);
            if (this.data[keyName])
                delete this.data[keyName];
        },
        setItem: function(keyName, data, options){
            options = options || {};
            if (!options.expires || !options.expiresIn){
                options.expiresIn = this.options.itemsExpireIn;
            }

            var storageData = { data: data };
            if (options.expires)
                storageData.expires = options.expires;
            else if (options.expiresIn)
                storageData.expires = new Date().valueOf() + options.expiresIn * 1000;

            this.storage.setItem(keyName, storageData);
            if (options.hold)
                this.data[keyName] = data;
        }
    };
})();