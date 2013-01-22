(function(){
    var prefix = "cache_";

    function Cache($rootScope, options){
        this.$rootScope = $rootScope;
        this.options = options || {};
        this.data = {};
        this.__defineGetter__("id", function(){ return options.id; });
    };

    Cache.prototype = {
        getKey: function(keyName){
            return [prefix, this.id, keyName].join("_");
        },
        getItem: function(keyName, options){
            var dataStr = localStorage.getItem(this.getKey(keyName));

            if (!dataStr)
                return null;

            var dataObj = JSON.parse(dataStr);

            if (dataObj && dataObj.expires && dataObj.expires < new Date().valueOf()){
                this.removeItem(keyName);
                return null;
            }

            var data = dataObj && dataObj.data;

            if (options && options.hold)
                this.data[keyName] = data;

            return data;
        },
        removeItem: function(keyName){
            localStorage.removeItem(this.getKey(keyName));
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

            localStorage.setItem(this.getKey(keyName), JSON.stringify(storageData));
            if (options.hold)
                this.data[keyName] = data;
        }
    };

    angular.module("Cache", []).factory('Cache', function ($injector) {
        return function(options) { return $injector.instantiate(Cache, { options: options }); };
    });
})();