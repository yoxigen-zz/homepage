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

    var methods = {
        login: function(apiName, options){
            var deferred = $q.defer(),
                existingOauth = oauths[apiName] || storage.local.getItem(apiName + "_oauth");

            if (existingOauth){
                if (existingOauth.expires > new Date().valueOf()){
                    if (!oauths[apiName])
                        oauths[apiName] = existingOauth;

                    // I don't understand why the timeout is needed, but the deferred's promise's 'then' method's success callback isn't fired otherwise.
                    setTimeout(function(){
                        deferred.resolve({ oauth: existingOauth });
                        $rootScope.$apply()
                    });

                    return deferred.promise;
                }
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