angular.module("GoogleOAuth2", ["Parse", "OAuth2"]).factory('GoogleOAuth2', ["$injector", "$rootScope", "$q", "OAuth2", "parse", function($injector, $rootScope, $q, OAuth2, parse){
    var clientId = "225561981539-vrlluijrg9h9gvq6ghbnnv59rcerkrh8.apps.googleusercontent.com"

    function GoogleOAuth2(options){
        this.oauth2 = new OAuth2({
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
                        access_token: result.access_token,
                        expires: now.setSeconds(now.getSeconds() + result.expires_in)
                    });
                }, deferred.reject);

                return deferred.promise;
            }
        });

        for(var method in this.oauth2){
            this[method] = this.oauth2[method];
        }
    }

    return function(options) { return $injector.instantiate(GoogleOAuth2, { options: options }); };
}]);