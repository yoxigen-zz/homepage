angular.module("OAuth", ["Storage"]).factory("oauth", ["$q", "$rootScope", "storage", function($q, $rootScope, storage){
    var redirectUri = "https://yoxigen.github.com/homepage",
        oauths = {};

    function getUrl(options, apiName){
        return options.baseUrl + (~options.baseUrl.indexOf("?") ? "&" : "?") +
            "client_id=" + options.clientId +
            "&scope=" + encodeURIComponent(options.scope) +
            "&redirect_uri=" + encodeURIComponent(options.redirectUri || redirectUri) +
            "&state=" + apiName +
            "&response_type=token";
    }

    function getExistingOauth(apiName){
        var existingOauth = oauths[apiName] || storage.local.getItem(apiName + "_oauth");
        if (existingOauth){
            if (existingOauth.expires > new Date().valueOf()){
                if (!oauths[apiName])
                    oauths[apiName] = existingOauth;

                return existingOauth;
            }
            else{
                storage.removeItem(apiName + "_oauth");
            }
        }

        return null;
    }

    var methods = {
        getOauth: getExistingOauth,
        isLoggedIn: function(apiName){
            return !!getExistingOauth(apiName);
        },
        login: function(apiName, options){
            var deferred = $q.defer(),
                existingOauth = getExistingOauth(apiName);

            if (existingOauth){
                setTimeout(function(){
                    deferred.resolve({ oauth: existingOauth });
                    $rootScope.$apply()
                });

                return deferred.promise;
            }

            methods.logout(apiName);

            chrome.tabs.getCurrent(function(currentTab){
                chrome.tabs.create({ url: getUrl(options, apiName) }, function(authTab){
                    function onRemoved(tabId){
                        if (tabId === authTab.id){
                            deferred.reject();
                            $rootScope.$apply();
                            chrome.tabs.onRemoved.removeListener(onRemoved);
                            chrome.tabs.onUpdated.removeListener(onUpdated);
                        }
                    }

                    function onUpdated(tabId, changeInfo, tab) {
                        if (tabId === authTab.id && tab.url.indexOf(options.redirectUri || redirectUri) === 0){
                            var auth = {
                                token: tab.url.match(/access_token=([^&#]+)/)[1],
                                expires: new Date().valueOf() + parseInt(tab.url.match(/expires_in=(\d+)/)[1], 10) * 1000
                            };

                            chrome.tabs.onRemoved.removeListener(onRemoved);
                            chrome.tabs.onUpdated.removeListener(onUpdated);

                            deferred.resolve({ oauth: auth, isNew: true });
                            $rootScope.$apply();
                            methods.setOauth(apiName, auth);
                            chrome.tabs.remove(tabId);

                            chrome.tabs.update(currentTab.id, { active: true });
                        }
                    }

                    chrome.tabs.onUpdated.addListener(onUpdated);
                    chrome.tabs.onRemoved.addListener(onRemoved);
                });
            });

            return deferred.promise;
        },
        logout: function(apiName){
            storage.local.removeItem(apiName + "_oauth");
        },
        setOauth: function(apiName, oauthData){
            storage.local.setItem(apiName + "_oauth", oauthData);
            oauths[apiName] = oauthData;
        }
    };

    return methods;
}]);