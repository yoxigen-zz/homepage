angular.module("HomepageInit", [])
    .run(function($http, $q, $rootScope){
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

        function loadWidgets(moduleType){
            var deferred = $q.defer();

            var widgetPromises = [];
            moduleType.widgets.forEach(function(module){
                widgetPromises.push($http.get("widgets/" + module.name + "/" + module.name + ".manifest.json"));
            });

            $q.all(widgetPromises).then(function(widgetsResults){
                var widgetName,
                    widgetManifestData,
                    resources = [],
                    dependencies = moduleType.module.dependencies || [];

                widgetsResults.forEach(function(widgetResults){
                    widgetManifestData = widgetResults.data;
                    widgetName = widgetResults.config.url.match(/([\w\d_-]+)\.manifest\.json$/i)[1];

                    if (widgetManifestData.modules){
                        widgetManifestData.modules.forEach(function(module){
                            if (module.dependencies && angular.isArray(module.dependencies)){
                                module.dependencies.forEach(function(dependency){
                                    if (!~dependencies.indexOf(dependency))
                                        dependencies.push(dependency);
                                });
                            }
                            dependencies.push(module.name);
                            angular.module(module.name, module.dependencies || []);
                        });
                    }

                    if (widgetManifestData.resources){
                        widgetManifestData.resources.forEach(function(resourceUrl){
                            resources.push("widgets/" + widgetName + "/" + resourceUrl + "?d=" + new Date().valueOf());
                        });
                    }
                });

                deferred.resolve({ resources: resources, dependencies: dependencies, moduleType: moduleType });
            });

            return deferred.promise;
        }

        function loadResources(urls){
            var deferred = $q.defer();
            requirejs(urls, function() {
                deferred.resolve();
                $rootScope.safeApply();
            });

            return deferred.promise;
        }

        $http.get("js/data/homepage.data.json").then(function(initData){
            var modulePromises = [],
                mainResourcesPromises = [];

            initData.data.modules.forEach(function(module){
                if (module.module || module.widgets)
                    modulePromises.push(loadWidgets(module));

                if (module.resources)
                    mainResourcesPromises.push(loadResources(module.resources));
            });

            $q.all(mainResourcesPromises).then(function(){
                $q.all(modulePromises).then(function(widgetsResults){
                    var requireJsUrls = [
                            "js/ng-controllers/homepage.controller.js",
                            "js/ng-controllers/notification.controller.js"
                        ],
                        ngModule;

                    widgetsResults.forEach(function(widgetResults){
                        requireJsUrls = requireJsUrls.concat(widgetResults.resources);
                        ngModule = angular.module(widgetResults.moduleType.module.name, widgetResults.dependencies);
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
                        })
                    });

                    angular.element(document.getElementById("appInit")).remove();
                    requirejs(requireJsUrls, function() {
                        angular.bootstrap(document, ["Homepage"]);
                    });
                });
            });
        });
    });