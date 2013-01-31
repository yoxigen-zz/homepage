(function(){
    function OAuth1($rootScope, $q, $http, options){
        this.$rootScope = $rootScope;
        this.config = options;
        this.$q = $q;
        this.$http = $http;

        this.getOauthToken = function(params){
            var deferred = this.$q.defer(),
                nonce = getNonce(),
                timestamp = getTimestamp();

            this.$http({
                method: "POST",
                url: params.url,
                params: {
                    oauth_nonce: nonce,
                    oauth_timestamp: timestamp,
                    oauth_consumer_key: params.consumerKey,
                    oauth_signature: getSignature(params.key, params.url, params.method, {
                        oauth_consumer_key: params.consumerKey,
                        oauth_nonce: nonce,
                        oauth_timestamp: timestamp,
                        oauth_signature_method: signatureMethod
                    }),
                    oauth_signature_method: signatureMethod
                },
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(result){
                    var resultParams = result.split("&"),
                        resultData = {};

                    resultParams.forEach(function(param){
                        var paramParts = param.split("=");
                        resultData[paramParts[0]] = decodeURIComponent(paramParts[1]);
                    });

                    deferred.resolve({ oauth: resultData, params: params });
                }).error(function(error){
                    console.error(error);
                    deferred.reject(error);
                });

            return deferred.promise;
        };
        this.getUserAuth = function(oauthData){
            var deferred = this.$q.defer();

            chrome.tabs.getCurrent(function(currentTab){
                chrome.tabs.create({ url: oauthData.oauth.xoauth_request_auth_url + "?oauth_token=" + encodeURIComponent(oauthData.oauth.oauth_token) }, function(authTab){
                    function onRemoved(tabId){
                        if (tabId === authTab.id){
                            deferred.reject();
                            $rootScope.$apply();
                            chrome.tabs.onRemoved.removeListener(onRemoved);
                            chrome.tabs.onUpdated.removeListener(onUpdated);
                        }
                    }

                    function onUpdated(tabId, changeInfo, tab) {
                        if (tabId === authTab.id && tab.url.indexOf(redirectUri) === 0){
                            var auth = {
                                token: tab.url.match(/oauth_token=([^&#]+)/)[1],
                                verifier: tab.url.match(/oauth_verifier=(\d+)/)[1]
                            };

                            chrome.tabs.onRemoved.removeListener(onRemoved);
                            chrome.tabs.onUpdated.removeListener(onUpdated);

                            chrome.tabs.remove(tabId);
                            chrome.tabs.update(currentTab.id, { active: true });

                            deferred.resolve({ userAuth: auth, isNew: true, oauth: oauthData });
                            $rootScope.$apply();
                        }
                    }

                    chrome.tabs.onUpdated.addListener(onUpdated);
                    chrome.tabs.onRemoved.addListener(onRemoved);
                });
            });

            return deferred.promise;
        };
        this.getAccessToken = function(authData){
            var deferred = this.$q.defer(),
                params = authData.oauth.params,
                nonce = getNonce(),
                timestamp = getTimestamp();

            var httpParams = {
                oauth_consumer_key: params.consumerKey,
                oauth_verifier: authData.userAuth.verifier,
                oauth_token: authData.userAuth.token,
                oauth_nonce: nonce,
                oauth_timestamp: timestamp,
                oauth_signature_method: signatureMethod
            };

            this.$http({
                method: "POST",
                url: params.accessTokenUrl,
                params: angular.extend(httpParams, { oauth_signature: getSignature(params.key+  authData.oauth.oauth.oauth_token_secret, params.accessTokenUrl, params.method, httpParams) }),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(result){
                    var resultParams = result.split("&"),
                        resultData = {};

                    resultParams.forEach(function(param){
                        var paramParts = param.split("=");
                        resultData[paramParts[0]] = decodeURIComponent(paramParts[1]);
                    });

                    deferred.resolve(resultData);
                }).error(function(error){
                    console.error(error);
                    deferred.reject(error);
                });

            return deferred.promise;
        };
    }

    OAuth1.prototype = {
        login: function(){
            var deferred = this.$q.defer(),
                self = this;

            var storageOauth = localStorage.getItem("oauth1_" + self.config.name);
            if (storageOauth){
                self.oauthData = JSON.parse(storageOauth);
                setTimeout(function(){
                    deferred.resolve(self.oauthData);
                    self.$rootScope.$apply();
                });
                return deferred.promise;
            }

            this.getOauthToken(this.config).then(function(resultData){
                self.oauthData = resultData.oauth;

                self.getUserAuth(resultData).then(function(authResult){
                    self.oauthData.verifier = authResult.userAuth.verifier;

                    self.getAccessToken(authResult).then(function(accessTokenData){
                        angular.extend(self.oauthData, {
                            access_token: accessTokenData.oauth_token,
                            access_token_secret: accessTokenData.oauth_token_secret,
                            expires: new Date().valueOf() + parseInt(accessTokenData.oauth_expires_in, 10)
                        });

                        console.log("FINAL: ", (self.oauthData))

                        localStorage.setItem("oauth1_" + self.config.name, JSON.stringify(self.oauthData));
                        deferred.resolve(accessTokenData);
                    });
                });
            });

            return deferred.promise;
        },
        makeSignedRequest: function(options){
            var deferred = this.$q.defer(),
                nonce = getNonce(),
                timestamp = getTimestamp(),
                url = options.url;

            var httpParams = angular.extend(options.params, {
                oauth_consumer_key: this.config.consumerKey,
                oauth_token: this.oauthData.access_token,
                oauth_nonce: nonce,
                oauth_timestamp: timestamp,
                oauth_signature_method: signatureMethod
            });

            this.$http({
                method: options.method || "POST",
                url: url,
                params: angular.extend(httpParams, { oauth_signature: getSignature(this.config.key + this.oauthData.access_token_secret, url, options.method || "POST", httpParams) }),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(result){
                    deferred.resolve(result);
                }).error(function(error){
                    console.error(error);
                    deferred.reject(error);
                });

            return deferred.promise;
        }
    };

    var nonceChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        nonceLength = 20,
        signatureMethod = "HMAC-SHA1",
        redirectUri = "https://yoxigen.github.com/homepage";

    function getTimestamp(){
        return Math.round((new Date()).valueOf() / 1000);
    }

    function getNonce(){
        var nonce = [];
        for( var i=0; i < nonceLength; i++)
            nonce.push(nonceChars.charAt(Math.floor(Math.random() * nonceChars.length)));

        return nonce.join("");
    }

    function getShaBaseString(baseUrl, method, data){
        var parameters = [];
        for(var i in data){
            var value = data[i];
            if (Object(value) === value)
                value = JSON.stringify(value);
            parameters.push([encodeURIComponent(i), i === "oauth_timestamp" ? value : encodeURIComponent(value)].join("="));
        }

        parameters.sort();
        parameters = parameters.join("&");

        return [method.toUpperCase(), encodeURIComponent(baseUrl), encodeURIComponent(parameters)].join("&");
    }
    function getSignature(key, baseUrl, method, data){
        var baseString = getShaBaseString(baseUrl, method, data),
            sha = new jsSHA(baseString, "ASCII");

        return sha.getHMAC(key, "ASCII", "SHA-1", "B64");
    }

    angular.module("OAuth1", []).factory('OAuth1', ["$injector", "$rootScope", "$http", "$q", function ($injector, $rootScope, $http, $q) {
        return function(options) { return $injector.instantiate(OAuth1, { options: options }); };
    }]);
})();