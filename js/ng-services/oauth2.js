angular.module("OAuth2", ["Parse"]).factory('OAuth2', ["$injector", "$rootScope", "$q", "Storage", "users", function ($injector, $rootScope, $q, Storage, users) {
    var defaultOptions = {
        oauthWindowDimensions: {
            width: 500,
            height: 350
        }
    };

    function OAuth2(options){
        this.options = angular.extend({}, defaultOptions, options);
        if (!OAuth2.prototype.storage)
            OAuth2.prototype.storage = new Storage("oauth2");
    }

    OAuth2.prototype = (function(){
        var redirectUri = "http://yoxigen.github.io/homepage/oauth2.html";

        function getUrl(state){
            var url = this.options.baseUrl + (~this.options.baseUrl.indexOf("?") ? "&" : "?") +
                "client_id=" + this.options.clientId +
                "&scope=" + encodeURIComponent(this.options.scope) +
                "&redirect_uri=" + encodeURIComponent(this.options.redirectUri || redirectUri) +
                "&response_type=" + (this.options.responseType || "token");

            if (state)
                url += "&state=" + state;

            return url;
        }

        function getCloudOauth(){
            return this.storage.cloud.query({ equalTo: ["api", this.options.apiName] }, { single: true });
        }

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
                    else if (self.options.refreshToken){
                        self.options.refreshToken(existingOauth).then(function(newTokenData){
                            self.oauthData = newTokenData;
                            deferred.resolve(self.oauthData);
                        }, deferred.resolve(null))
                    }
                    else{
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
                                resolve();
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
            hasValidAccessToken: function(){
                return this.oauthData && new Date(this.oauthData) > new Date();
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

                    //self.logout();

                    var state = self.getOauthState();

                    window["setOauth2_" + state] = function(auth){
                        delete window["setOauth2_" + state];
                        oauthWindow.close();

                        function onDone(){
                            $rootScope.safeApply(function(){
                                methods.setOauth.call(self, auth);
                                deferred.resolve({ oauth: auth, isNew: true });
                            });
                        }

                        if (self.options.tokenValidation){
                            self.options.tokenValidation(auth).then(onDone, deferred.reject);
                        }
                        else
                            onDone();
                    };

                    oauthWindow = window.open(getUrl.call(self, state), "_blank", ["location=0", "width=" + self.options.oauthWindowDimensions.width, "height=" + self.options.oauthWindowDimensions.height, "toolbar=no"].join(","));
                });

                return deferred.promise;
            },
            logout: function(){
                this.storage.local.removeItem("oauth");
                if (users.getCurrentUser())
                    getCloudOauth.call(this).then(function(oauthObject){
                        oauthObject && oauthObject.destroy();
                    });

                this.oauthData = null;
            },
            setOauth: function(oauthData){
                var self = this;
                if (users.getCurrentUser()){
                    getCloudOauth.call(this).then(function(oauthObject){
                        if (oauthObject){

                            for(var oauthProperty in oauthData){
                                oauthObject.set(oauthProperty, oauthData[oauthProperty]);
                            }
                            oauthObject.save();
                        }
                        else{
                            self.storage.cloud.setItem(null, angular.extend(oauthData, { api: self.options.apiName }));
                        }
                    }, function(error){
                        console.error("No auth obj: ", error);
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
