angular.module("GoogleOAuth2", ["Parse", "OAuth2"]).factory('GoogleOAuth2', ["$injector", "$rootScope", "$q", "$http", "OAuth2", "parse", function($injector, $rootScope, $q, $http, OAuth2, parse){
    var clientId = "225561981539-vrlluijrg9h9gvq6ghbnnv59rcerkrh8.apps.googleusercontent.com",
        scopes = [];

    function GoogleOAuth2(options){
        var oauth2 = new OAuth2({
            apiName: options.apiName,
            baseUrl: "https://accounts.google.com/o/oauth2/auth?access_type=offline&approval_prompt=force",
            redirectUri: "http://yoxigen.github.io/homepage/oauth2.html",
            responseType: "code",
            clientId: clientId,
            scope: options.scope,
            oauthWindowDimensions: {
                width: 765,
                height: 500
            },
            tokenValidation: function(oauthData){
                var deferred = $q.defer();

                parse.runFunction("googleAuth", {
                    code: oauthData.code,
                    client_id: clientId,
                    redirect_uri: "http://yoxigen.github.io/homepage/oauth2.html",
                    grant_type: "authorization_code"
                }).then(function(result){
                    oauthData.token = result.access_token;
                    oauthData.refreshToken = result.refresh_token;

                    var now = new Date();
                    oauthData.expires = now.setSeconds(now.getSeconds() + result.expires_in).valueOf();
                    deferred.resolve(oauthData);
                }, function(error){
                        console.error("ERROR: ", error);
                        deferred.reject(error);
                    });

                return deferred.promise;
            },
            refreshToken: function(oauthData){
                var deferred = $q.defer();

                parse.runFunction("googleAuthRefreshToken", {
                    refresh_token: oauthData.refreshToken,
                    client_id: clientId
                }).then(function(result){
                    var now = new Date();

                    deferred.resolve({
                        token: result.access_token,
                        expires: now.setSeconds(now.getSeconds() + result.expires_in).valueOf()
                    });
                }, deferred.reject);

                return deferred.promise;
            }
        });

        oauth2.onLogin.addListener(function(oauthData){
            this.oauthData = oauthData;
        });

        this.getCurrentUser = function(){
            var deferred = $q.defer();

            oauth2.getOauth().then(function(oauthData){
                if (oauthData){
                    $http.jsonp("https://www.googleapis.com/oauth2/v2/userinfo", {
                        params: { callback: "JSON_CALLBACK", key: clientId, access_token: oauthData.token }
                    }).then(function(result){
                        deferred.resolve({
                            id: result.data.id,
                            name: result.data.name,
                            link: result.data.link,
                            locale: result.data.locale,
                            image: result.data.picture
                        });
                    }, deferred.reject);
                }
            });

            return deferred.promise;
        };

        for(var method in oauth2){
            this[method] = oauth2[method];
        }
    }

    return function(options) { return $injector.instantiate(GoogleOAuth2, { options: options }); };
}]);