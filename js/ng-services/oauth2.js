(function(){
    angular.module("OAuth2", []).factory('OAuth2', ["$injector", "$rootScope", "$q", "Storage", function ($injector) {
        return function(options) { return $injector.instantiate(OAuth2, { options: options }); };
    }]);

    var defaultOptions = {
        oauthWindowDimensions: {
            width: 500,
            height: 350
        }
    };

    function OAuth2($rootScope, $q, Storage, options){
        this.$rootScope = $rootScope;
        this.$q = $q;
        this.options = angular.extend({}, defaultOptions, options);
        this.storage = new Storage("oauth2_" + options.apiName);
    }

    OAuth2.prototype = (function(){
        var redirectUri = document.location.href + "/oauth2.html";

        function getUrl(state){
            var url = this.options.baseUrl + (~this.options.baseUrl.indexOf("?") ? "&" : "?") +
                "client_id=" + this.options.clientId +
                "&scope=" + encodeURIComponent(this.options.scope) +
                "&redirect_uri=" + encodeURIComponent(this.options.redirectUri || redirectUri) +
                "&response_type=token";

            if (state)
                url += "&state=" + state;

            return url;
        }

        var methods = {
            getOauth: function(){
                var deferred = this.$q.defer(),
                    existingOauth = this.oauthData,
                    self = this;

                function resolve(){
                    if (!existingOauth.expires || existingOauth.expires > new Date().valueOf()){
                        self.oauthData = existingOauth;
                        deferred.resolve(existingOauth);
                    }
                    else{
                        self.storage.removeItem("oauth");
                        deferred.resolve(null);
                    }
                }

                if (existingOauth){
                    resolve();
                }
                else{
                    this.storage.local.getItem("oauth").then(function(oauthData){
                        if (oauthData){
                            existingOauth = oauthData;
                            resolve();
                        }
                        else{
                            deferred.resolve(null);
                        }
                    })
                }

                return deferred.promise;
            },
            getOauthState: function(){
                if (!OAuth2.prototype.lastOauthState)
                    OAuth2.prototype.lastOauthState = 0;

                return ++OAuth2.prototype.lastOauthState;
            },
            isLoggedIn: function(){
                var deferred = this.$q.defer();
                this.getOauth().then(function(auth){
                    deferred.resolve(!!auth);
                }, function(error){
                    deferred.resolve(false)
                });

                return deferred.promise;
            },
            login: function(){
                var deferred = this.$q.defer(),
                    self = this,
                    oauthWindow;

                this.getOauth().then(function(existingOauth){
                    if (existingOauth){
                        setTimeout(function(){
                            deferred.resolve({ oauth: existingOauth });
                            self.$rootScope.$apply()
                        });

                        return deferred.promise;
                    }

                    self.logout();

                    window["oauthOnResult_" + self.options.apiName] = function(oauthResult){
                        methods.setOauth.call(self, oauthResult);
                        deferred.resolve({ oauth: oauthResult, isNew: true });
                        self.$rootScope.$apply();
                    };

                    var state = self.getOauthState();

                    window["setOauth2_" + state] = function(response){
                        delete window["setOauth2_" + state];
                        oauthWindow.close();
                        methods.setOauth.call(self, auth);
                        deferred.resolve({ oauth: auth, isNew: true });
                        self.$rootScope.$apply();
                    };

                    oauthWindow = window.open(getUrl.call(self, state), "_blank", ["location=0", "width=" + self.options.oauthWindowDimensions.width, "height=" + self.options.oauthWindowDimensions.height, "toolbar=no"].join(","));

                    /*
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
                    */
                    //chrome.tabs.onUpdated.addListener(onUpdated);
                    //chrome.tabs.onRemoved.addListener(onRemoved);
                });

                return deferred.promise;
            },
            logout: function(){
                this.storage.local.removeItem("oauth");
                this.oauthData = null;
            },
            setOauth: function(oauthData){
                this.storage.local.setItem("oauth", oauthData);
                this.oauthData = oauthData;
            }
        };

        return methods;
    })();
})();