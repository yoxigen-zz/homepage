(function(){
    angular.module("OAuth2", []).factory('OAuth2', ["$injector", "$rootScope", "$q", "Storage", function ($injector) {
        return function(options) { return $injector.instantiate(OAuth2, { options: options }); };
    }]);

    function OAuth2($rootScope, $q, $http, Storage, options){
        this.$rootScope = $rootScope;
        this.$q = $q;
        this.options = options;
        this.storage = new Storage("oauth2_" + options.apiName);
    }

    OAuth2.prototype = (function(){
        var redirectUri = "https://yoxigen.github.com/homepage";

        function getUrl(){
            return this.options.baseUrl + (~this.options.baseUrl.indexOf("?") ? "&" : "?") +
                "client_id=" + this.options.clientId +
                "&scope=" + encodeURIComponent(this.options.scope) +
                "&redirect_uri=" + encodeURIComponent(this.options.redirectUri || redirectUri) +
                "&state=" + this.options.apiName +
                "&response_type=token";
        }

        var methods = {
            getOauth: function(){
                var existingOauth = this.oauthData || this.storage.local.getItem("oauth");
                if (existingOauth){
                    if (!existingOauth.expires || existingOauth.expires > new Date().valueOf()){
                        this.oauthData = existingOauth;
                        return existingOauth;
                    }
                    else{
                        this.storage.removeItem("oauth");
                    }
                }

                return null;
            },
            get isLoggedIn(){
                console.log("IS: ", this.options.apiName, this.getOauth())
                return !!this.getOauth();
            },
            login: function(){
                var deferred = this.$q.defer(),
                    existingOauth = this.getOauth(),
                    self = this;

                if (existingOauth){
                    setTimeout(function(){
                        deferred.resolve({ oauth: existingOauth });
                        self.$rootScope.$apply()
                    });

                    return deferred.promise;
                }

                this.logout();

                chrome.tabs.getCurrent(function(currentTab){
                    chrome.tabs.create({ url: getUrl.call(self) }, function(authTab){
                        function onRemoved(tabId){
                            if (tabId === authTab.id){
                                deferred.reject();
                                self.$rootScope.$apply();
                                chrome.tabs.onRemoved.removeListener(onRemoved);
                                chrome.tabs.onUpdated.removeListener(onUpdated);
                            }
                        }

                        function onUpdated(tabId, changeInfo, tab) {
                            if (tabId === authTab.id && tab.url.indexOf(self.options.redirectUri || redirectUri) === 0){
                                var expiresMatch = tab.url.match(/expires_in=(\d+)/),
                                    auth = {
                                        token: tab.url.match(/access_token=([^&#]+)/)[1],
                                        expires: expiresMatch ? new Date().valueOf() + parseInt(expiresMatch[1], 10) * 1000 : undefined
                                    };

                                chrome.tabs.onRemoved.removeListener(onRemoved);
                                chrome.tabs.onUpdated.removeListener(onUpdated);

                                methods.setOauth.call(self, auth);
                                deferred.resolve({ oauth: auth, isNew: true });
                                self.$rootScope.$apply();
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
            logout: function(){
                this.storage.local.removeItem("oauth");
            },
            setOauth: function(oauthData){
                this.storage.local.setItem("oauth", oauthData);
                this.oauthData = oauthData;
            }
        };

        return methods;
    })();
})();