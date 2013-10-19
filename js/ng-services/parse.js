angular.module("Parse", []).factory("parse", ["$q", "$rootScope", function($q, $rootScope){
    var homepageAppId = "WqKXJxJYkLJF4QavOnURbZOmWeIVPmIu7Iy3XjMa",
        homepageJavascriptKey = "lofx3rk1xTk7502I88bkYnXodCsUIY16N3MRGufb",
        facebookUtilsInit;

    Parse.initialize(homepageAppId, homepageJavascriptKey);
    Parse.Object.prototype.getData = function(){
        var data = angular.copy(this.attributes);
        delete data.user;
        delete data.ACL;

        return data;
    };

    Parse.Object.prototype.update = function(){
        var data = angular.copy(this.getData());
        for(var property in data){
            this.set(property, data[property]);
        }

        this.save();
    };

    var defaultGetOptions = {
        forCurrentUser: true
    };

    var defaultSaveOptions = {
        setUser: true,
        isPrivate: true
    };

    var methods = {
        facebookLogin: function(){
            var deferred = $q.defer();
            if (!facebookUtilsInit){
                Parse.FacebookUtils.init();
                facebookUtilsInit = true;
            }

            Parse.FacebookUtils.logIn("manage_notifications,user_photos", {
                success: function(user) {
                    // If it's a new user, let's fetch their name from FB
                    if (!user.existed()) {
                        // We make a graph request
                        FB.api('/me', function(response) {
                            if (!response.error) {
                                // We save the data on the Parse user
                                user.set("displayName", response.name);
                                user.save(null, {
                                    success: function(user) {
                                        $rootScope.$apply(function(){
                                            deferred.resolve(user);
                                        });
                                    },
                                    error: function(user, error) {
                                        $rootScope.$apply(function(){
                                            deferred.reject(error);
                                        });
                                    }
                                });
                            } else {
                                console.log("Oops something went wrong with facebook.");
                            }
                        });
                        // If it's an existing user that was logged in, we save the score
                    } else {
                        $rootScope.$apply(function(){
                            deferred.resolve(user);
                        });
                    }
                },
                error: function(user, error) {
                    $rootScope.$apply(function(){
                        deferred.reject(error);
                    });
                }
            });

            return deferred.promise;
        },
        get: function(className, options){
            var deferred = $q.defer();
            var ObjType = Parse.Object.extend(className),
                query = new Parse.Query(ObjType);

            options = angular.extend({}, defaultGetOptions, options);

            var onData = {
                success: function(results){
                    $rootScope.$apply(function(){
                        deferred.resolve(results)
                    });
                },
                error: function(error){
                    $rootScope.$apply(function(){
                        deferred.reject(error);
                    });
                }
            };

            if (options.forCurrentUser){
                query.equalTo("user", Parse.User.current());
            }

            query.find(onData);

            return deferred.promise;
        },
        getCurrentUser: function(){
            var parseUser = Parse.User.current();
            if (parseUser && parseUser.attributes.authData && parseUser.attributes.authData.facebook)
                parseUser.attributes.image = "http://graph.facebook.com/" + parseUser.attributes.authData.facebook.id + "/picture";

            return parseUser;
        },
        login: function(username, password){
            var deferred = $q.defer();

            Parse.User.logIn(username, password, {
                success: function(user) {
                    $rootScope.$apply(function(){
                        deferred.resolve(user);
                    });
                },
                error: function(user, error) {
                    $rootScope.$apply(function(){
                        deferred.reject(error);
                    });
                }
            });

            return deferred.promise;
        },
        logout: function(){
            Parse.User.logOut();
        },
        query: function(className, constrains, options){
            options = options || {};
            var deferred = $q.defer();
            var ObjType = Parse.Object.extend(className),
                query = new Parse.Query(ObjType);

            if (options.forCurrentUser !== false){
                query.equalTo("user", Parse.User.current());
            }

            if (angular.isArray(constrains)){
                angular.forEach(constrains, function(constrain){
                    for(var method in constrain){
                        query[method] && query[method].apply(query, constrain[method]);
                    }
                });
            }
            else{
                for(var method in constrains){
                    query[method] && query[method].apply(query, constrains[method]);
                }
            }

            var onResults = {
                success: function(results){
                    $rootScope.$apply(function(){
                        deferred.resolve(results);
                    });
                },
                error: function(error){
                    $rootScope.$apply(function(){
                        deferred.reject(error);
                    });
                }
            };

            if (options.single)
                query.first(onResults);
            else
                query.find(onResults);

            return deferred.promise;
        },
        runFunction: function(functionName, params){
            var deferred = $q.defer();

            Parse.Cloud.run(functionName, params || {}, {
                success: function(result) {
                    $rootScope.safeApply(function(){
                        deferred.resolve(result);
                    });
                },
                error: function(error) {
                    $rootScope.safeApply(function(){
                        deferred.reject(error);
                    });
                }
            });

            return deferred.promise;
        },
        save: function(className, data, options){
            var ObjType = Parse.Object.extend(className),
                obj = new ObjType(),
                deferred = $q.defer();

            options = angular.extend({}, defaultSaveOptions, options);

            if (options.setUser){
                var currentUser = Parse.User.current();
                obj.set("user", currentUser);
                if (options.isPrivate)
                    obj.setACL(new Parse.ACL(currentUser));
            }

            obj.save(data, {
                success: function(obj){
                    console.log("Saved object %s:", className, obj);
                    $rootScope.$apply(function(){
                        deferred.resolve(obj);
                    })
                },
                error: function(obj, error){
                    console.error("NOOO: ", error);
                    $rootScope.$apply(function(){
                        deferred.reject(error);
                    });
                }
            });

            return deferred.promise;
        },
        signUp: function(userDetails){
            var user = new Parse.User(userDetails),
                deferred = $q.defer();

            user.signUp(null, {
                success: function(user) {
                    $rootScope.$apply(function(){
                        deferred.resolve(user);
                    });
                },
                error: function(user, error) {
                    $rootScope.$apply(function(){
                        deferred.reject(error);
                    });
                }
            });

            return deferred.promise;
        }
    };

    return methods;
}]);