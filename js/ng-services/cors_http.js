angular.module("CORS", [])
    .run(function($rootScope) {
        if (!$rootScope.safeApply) {
            $rootScope.safeApply = function(fn) {
                var phase = this.$root.$$phase;
                if(phase == '$apply' || phase == '$digest') {
                    if(fn && (typeof(fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };
        }
    })
    .factory("corsHttp", ["$q", "$rootScope", function($q, $rootScope){
    var methods = {
            http: function(options){
                if (!options || !options.url)
                    throw new Error("You must provide at least a URL for http.");

                var deferred = $q.defer(),
                    paramsQuery = [];

                if (options.params){
                    for(var key in options.params){
                        paramsQuery.push([key, encodeURIComponent(options.params[key])].join("="));
                    }

                    if (paramsQuery.length){
                        options.url += ~options.url.indexOf("?") ? "&" : "?";
                        options.url += paramsQuery.join("&");
                    }
                }

                var xhr = new XMLHttpRequest();
                xhr.open(options.method, options.url);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.onreadystatechange = function() {
                    if (this.status == 200 && this.readyState == 4) {
                        if (options.parseResponse){
                            var responseParams = this.responseText.split("&"),
                                responseData = {},
                                paramParts;

                            angular.forEach(responseParams, function(param){
                                paramParts = param.split("=");
                                responseData[paramParts[0]] = paramParts[1];
                            });

                            deferred.resolve(responseData);
                            $rootScope.safeApply();

                            if (options.success){
                                options.success.call(this, responseData);
                            }
                        }
                        else{
                            setTimeout(function(){
                                deferred.resolve(this.responseText);
                                $rootScope.safeApply();
                            });
                        }
                    }
                    else{
                        deferred.reject(this);
                    }
                };
                xhr.send();

                return deferred.promise;
            },
            get: function(options){
                options.method = "GET";
                return methods.http(options);
            },
            post: function(options){
                options.method = "POST";
                return methods.http(options);
            }
        };

    return methods;
}]);