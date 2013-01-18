angular.module('Storage', [])
    .factory('storage', function() {
        var storageKeyPrefix = "",
            storageKeyPrefixRegExp = new RegExp("^" + storageKeyPrefix);

        function getStorageKeyName(key){
            return storageKeyPrefix + key;
        }

        function getStorageApi(storage){
            return {
                getItem: function(key){
                    var storageData = storage.getItem(getStorageKeyName(key));
                    return storageData ? JSON.parse(storageData).data : null;
                },
                setItem: function(key, data){
                    storage.setItem(getStorageKeyName(key), JSON.stringify({ data: data }));
                },
                removeItem: function(key){
                    storage.removeItem(getStorageKeyName(key));
                },
                clear: function(){
                    for(var keyName in storage){
                        if (storageKeyPrefixRegExp.test(keyName))
                            storage.removeItem(keyName);
                    }
                }
            };
        }

        return {
            local: getStorageApi(localStorage),
            session: getStorageApi(sessionStorage)
        };
    });