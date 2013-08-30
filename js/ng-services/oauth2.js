(function(){
    angular.module("OAuth2", ["Parse"]).factory('OAuth2', ["$injector", "$rootScope", "$q", "Storage", "users", function ($injector, $rootScope, $q, Storage, users) {
        var defaultOptions = {
            oauthWindowDimensions: {
                width: 500,
                height: 350
            }
        };

        function OAuth2(options){
            this.options = angular.extend({}, defaultOptions, options);
            this.storage = new Storage("oauth2");
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

            var getCloudOauth = function(){
                return this.storage.cloud.query({ equals: ["api", this.options.apiName] }, { single: true });
            }.bind(this);

            var methods = {
                destroy: function(){
                    this.storage.destroy();
                },
                getOauth: function(){
                    var deferred = $q.defer(),
                        existingOauth = this.oauthData,
                        self = this;

                    var getFromLocal = function(){
                        this.storage.local.getItem(this.options.apiName + "oauth").then(function(oauthData){
                            if (oauthData){
                                existingOauth = oauthData;
                                resolve();
                            }
                            else{
                                deferred.resolve(null);
                            }
                        });
                    }.bind(this);

                    function resolve(){
                        if (!existingOauth.expires || existingOauth.expires > new Date().valueOf()){
                            self.oauthData = existingOauth;
                            deferred.resolve(existingOauth);
                        }
                        else{
                            self.storage.removeItem(this.options.apiName + "oauth");
                            deferred.resolve(null);
                        }
                    }

                    if (existingOauth){
                        resolve();
                    }
                    else{
                        if (users.getCurrentUser()){
                            getCloudOauth.call(self).then(function(oauthCloudData){
                                if (oauthCloudData){
                                    existingOauth = oauthCloudData.getData();
                                    resolve;
                                }
                                else
                                    getFromLocal();
                            }, function(error){
                                getFromLocal();
                            });
                        }
                        else
                            getFromLocal();
                    }

                    return deferred.promise;
                },
                getOauthState: function(){
                    if (!OAuth2.prototype.lastOauthState)
                        OAuth2.prototype.lastOauthState = 0;

                    return ++OAuth2.prototype.lastOauthState;
                },
                isLoggedIn: function(){
                    var deferred = $q.defer();
                    this.getOauth().then(function(auth){
                        deferred.resolve(!!auth);
                    }, function(error){
                        deferred.resolve(false)
                    });

                    return deferred.promise;
                },
                login: function(){
                    var deferred = $q.defer(),
                        self = this,
                        oauthWindow;

                    this.getOauth().then(function(existingOauth){
                        if (existingOauth){
                            setTimeout(function(){
                                deferred.resolve({ oauth: existingOauth });
                                $rootScope.$apply()
                            });

                            return deferred.promise;
                        }

                        self.logout();

                        var state = self.getOauthState();

                        window["setOauth2_" + state] = function(auth){
                            delete window["setOauth2_" + state];
                            oauthWindow.close();
                            methods.setOauth.call(self, auth);
                            deferred.resolve({ oauth: auth, isNew: true });
                            $rootScope.$apply();
                        };

                        oauthWindow = window.open(getUrl.call(self, state), "_blank", ["location=0", "width=" + self.options.oauthWindowDimensions.width, "height=" + self.options.oauthWindowDimensions.height, "toolbar=no"].join(","));
                    });

                    return deferred.promise;
                },
                logout: function(){
                    this.storage.local.removeItem("oauth");
                    if (users.getCurrentUser())
                        getCloudOauth().then(function(oauthObject){
                            oauthObject.destroy();
                        });

                    this.oauthData = null;
                },
                setOauth: function(oauthData){
                    if (users.getCurrentUser()){
                        getCloudOauth().then(function(oauthObject){
                            if (oauthObject){
                                for(var oauthProperty in oauthData){
                                    oauthObject.set(oauthProperty, oauthData[oauthProperty]);
                                }
                                oauthObject.save();
                            }
                            else
                                this.storage.cloud.setItem(null, angular.extend(oauthData, { api: this.options.apiName }));
                        });
                    }
                    else
                        this.storage.local.setItem(this.options.apiName + "oauth", oauthData);

                    this.oauthData = oauthData;
                }
            };

            return methods;
        })();

        return function(options) { return $injector.instantiate(OAuth2, { options: options }); };
    }]);
})();