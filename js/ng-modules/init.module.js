angular.module("HomepageInit", [])
    .run(function($http, $q){
        $http.get("js/data/homepage.data.json").then(function(initData){
            var widgetPromises = [];
            initData.data.widgets.forEach(function(widgetName){
                widgetPromises.push($http.get("widgets/" + widgetName + "/" + widgetName + ".manifest.json"));
            });

            $q.all(widgetPromises).then(function(widgetsResults){
                var widgetName,
                    widgetManifestData,
                    requireJsUrls = [];

                widgetsResults.forEach(function(widgetResults){
                    widgetManifestData = widgetResults.data;
                    widgetName = widgetResults.config.url.match(/([\w\d_-]+)\.manifest\.json$/i)[1];

                    if (widgetManifestData.modules){
                        widgetManifestData.modules.forEach(function(module){
                            angular.module(module.name, module.dependencies || []);
                        });
                    }

                    if (widgetManifestData.resources){
                        widgetManifestData.resources.forEach(function(resourceUrl){
                            requireJsUrls.push("widgets/" + widgetName + "/" + resourceUrl + "?d=" + new Date().valueOf());
                        });
                    }
                });

                angular.element(document.getElementById("appInit")).remove();
                requirejs(requireJsUrls, function() {
                    angular.bootstrap(document, ["Homepage"]);
                });
            });
        });
    });