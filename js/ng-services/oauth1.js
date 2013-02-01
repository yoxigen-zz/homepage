(function(){
    requirejs(["js/lib/sha1.js"]);

    angular.module("OAuth1", []).factory('OAuth1', ["$injector", "$rootScope", "$http", "$q", function ($injector) {
        return function(options) { return $injector.instantiate(OAuth1, { options: options }); };
    }]);

    function OAuth1($rootScope, $q, $http, options){
        this.$rootScope = $rootScope;
        this.config = options;
        this.$q = $q;
        this.$http = $http;
    }

    OAuth1.prototype = {
        getAccessToken: function(){
            var deferred = this.$q.defer();

            this.makeSignedRequest({
                url: this.config.accessTokenUrl,
                params: { oauth_verifier: this.oauthData.oauth_verifier }
            }).then(function(result){
                    var resultParams = result.split("&"),
                        resultData = {};

                    resultParams.forEach(function(param){
                        var paramParts = param.split("=");
                        resultData[paramParts[0]] = decodeURIComponent(paramParts[1]);
                    });

                    deferred.resolve(resultData);
                }, function(error){
                    deferred.reject(error);
                });

            return deferred.promise;
        },
        getRequestToken: function(params){
            var deferred = this.$q.defer(),
                self = this;

            this.makeSignedRequest({
                url: this.config.requestTokenUrl,
                params: { scope: this.config.scope }
            }).then(function(result){
                    var resultParams = result.split("&"),
                        resultData = {};

                    resultParams.forEach(function(param){
                        var paramParts = param.split("=");
                        resultData[paramParts[0]] = decodeURIComponent(paramParts[1]);
                    });

                    self.oauthData = resultData;
                    deferred.resolve();
                }, function(error){
                    console.error(error);
                    deferred.reject(error);
                });

            return deferred.promise;
        },
        getUserAuth: function(){
            var deferred = this.$q.defer(),
                self = this;

            chrome.tabs.getCurrent(function(currentTab){
                chrome.tabs.create({ url: self.oauthData.xoauth_request_auth_url + "?oauth_token=" + encodeURIComponent(self.oauthData.oauth_token) }, function(authTab){
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
                            angular.extend(self.oauthData, {
                                oauth_token: tab.url.match(/oauth_token=([^&#]+)/)[1],
                                oauth_verifier: tab.url.match(/oauth_verifier=(\d+)/)[1]
                            });

                            chrome.tabs.onRemoved.removeListener(onRemoved);
                            chrome.tabs.onUpdated.removeListener(onUpdated);

                            chrome.tabs.remove(tabId);
                            chrome.tabs.update(currentTab.id, { active: true });

                            deferred.resolve();
                            self.$rootScope.$apply();
                        }
                    }

                    chrome.tabs.onUpdated.addListener(onUpdated);
                    chrome.tabs.onRemoved.addListener(onRemoved);
                });
            });

            return deferred.promise;
        },
        login: function(){
            var deferred = this.$q.defer(),
                self = this;

            var storageOauth = localStorage.getItem(self.config.name + "_oauth1");
            if (storageOauth){
                self.oauthData = JSON.parse(storageOauth);
                setTimeout(function(){
                    deferred.resolve(self.oauthData);
                    self.$rootScope.$apply();
                });
                return deferred.promise;
            }

            this.getRequestToken(this.config).then(function(resultData){
                self.getUserAuth(resultData).then(function(authResult){
                    self.getAccessToken(authResult).then(function(accessTokenData){
                        self.oauthData = {
                            access_token: accessTokenData.oauth_token,
                            access_token_secret: accessTokenData.oauth_token_secret,
                            expires: new Date().valueOf() + parseInt(accessTokenData.oauth_expires_in, 10) * 1000
                        };

                        localStorage.setItem(self.config.name + "_oauth1", JSON.stringify(self.oauthData));
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
                url = options.url,
                signatureKey = this.config.consumerSecret + "&";

            var httpParams = angular.extend(options.params || {}, {
                oauth_consumer_key: this.config.consumerKey,
                oauth_nonce: nonce,
                oauth_timestamp: timestamp,
                oauth_signature_method: signatureMethod
            });

            if (this.oauthData){
                httpParams.oauth_token = this.oauthData.access_token || this.oauthData.oauth_token;
                signatureKey += this.oauthData.access_token_secret || this.oauthData.oauth_token_secret || "";
            }

            this.$http({
                method: options.method || "POST",
                url: url,
                params: angular.extend(httpParams, {
                    oauth_signature: getSignature(signatureKey, url, options.method || "POST", httpParams)
                }),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(result){
                    deferred.resolve(result);
                }).error(function(error){
                    console.error("Error making oauth signed request: ", error);
                    deferred.reject(error);
                });

            return deferred.promise;
        }
    };

    var nonceChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        nonceLength = 20,
        signatureMethod ="HMAC-SHA1",
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

    function encodeForBaseString(str){
        return encodeURIComponent(str).replace(/\(/g, "%28").replace(/\)/g, "%29");
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

        return [method.toUpperCase(), encodeForBaseString(baseUrl), encodeForBaseString(parameters)].join("&");
    }
    function getSignature(key, baseUrl, method, data){
        var baseString = getShaBaseString(baseUrl, method, data),
            sha = new jsSHA(baseString, "ASCII");

        return sha.getHMAC(key, "ASCII", "SHA-1", "B64");
    }
})();