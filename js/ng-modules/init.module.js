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
                "OAuth1",
                "OAuth2",
                "Cache",
                "HomepageModel"
            ],
            appResources = [
                "js/ng-controllers/homepage.controller.js",
                "js/ng-controllers/notification.controller.js",
                "js/ng-controllers/widget.controller.js?d=" + new Date().valueOf()
            ];

        model.getModel().then(function(model){
            var dependencies = [],
                resources = [],
                styles = [],
                ngModule;

            function getDependenciesAndResources(module, moduleType){
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
                        resources.push(["modules", moduleType, module.id, resourceUrl].join("/"));
                    });
                }

                if (module.css){
                    module.css.forEach(function(cssUrl){
                        styles.push(["modules", moduleType, module.id, cssUrl].join("/"));
                    });
                }
            }

            function loadStyles(styles){
                styles.forEach(function(styleHref){
                    var link = document.createElement("link");
                    link.type = "text/css";
                    link.setAttribute("href",styleHref);
                    link.setAttribute("rel", "Stylesheet");
                    document.head.appendChild(link);
                });
            }

            angular.forEach(model, function(type, typeName){
                angular.forEach(type, function(module){
                    if (angular.isArray(module))
                        angular.forEach(module, function(module){
                            getDependenciesAndResources(module, typeName);
                        });
                    else
                        getDependenciesAndResources(module, typeName);
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
            styles.length && loadStyles(styles);
            requirejs(appResources.concat(resources), function() {
                angular.bootstrap(document, ["Homepage"]);
            });
        });
    });