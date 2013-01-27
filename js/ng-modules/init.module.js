angular.module("HomepageInit", ["HomepageModel"])
    .run(function($http, $q, $rootScope, model){
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

        var appDependencies = [
                "Utils",
                "PrettyDate",
                "FavIcon",
                "OAuth",
                "Cache",
                "HomepageModel"
            ],
            appResources = [
                "js/ng-controllers/homepage.controller.js?d=" + new Date().valueOf(),
                "js/ng-controllers/notification.controller.js?d=" + new Date().valueOf()
            ];

        function loadResources(urls){
            var deferred = $q.defer();
            requirejs(urls, function() {
                deferred.resolve();
                $rootScope.safeApply();
            });

            return deferred.promise;
        }

        model.getModel().then(function(model){
            var dependencies = [],
                resources = [],
                ngModule;

            function getDependenciesAndResources(module){
                if (module.modules){
                    module.modules.forEach(function(module){
                        if (module.dependencies && angular.isArray(module.dependencies)){
                            module.dependencies.forEach(function(dependency){
                                if (!~dependencies.indexOf(dependency))
                                    dependencies.push(dependency);
                            });
                        }

                        if (!~dependencies.indexOf(module.name))
                            dependencies.push(module.name);

                        angular.module(module.name, module.dependencies || []);
                    });
                }

                if (module.resources){
                    module.resources.forEach(function(resourceUrl){
                        resources.push("widgets/" + module.id + "/" + resourceUrl + "?d=" + new Date().valueOf());
                    });
                }
            }

            angular.forEach(model, function(type, typeName){
                angular.forEach(type, function(module){
                    if (angular.isArray(module))
                        angular.forEach(module, getDependenciesAndResources);
                    else
                        getDependenciesAndResources(module);
                });
            });

            ngModule = angular.module("Homepage", appDependencies.concat(dependencies));
            ngModule.run(function($rootScope){
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
            });

            angular.element(document.getElementById("appInit")).remove();
            requirejs(appResources.concat(resources), function() {
                angular.bootstrap(document, ["Homepage"]);
            });
        });
    });