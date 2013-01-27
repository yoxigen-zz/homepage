angular.module("HomepageModel", ["Storage"]).factory("model", ["$q", "$http", "storage", function($q, $http, storage){
    var defaultModelUrl = "js/data/default_model.json",
        model;

    function getModelData (){
        var deferred = $q.defer(),
            storageModel = storage.local.getItem("homepage_model");

        if (storageModel){
            deferred.resolve(storageModel);
        }
        else{
            $http.get(defaultModelUrl).then(function(defaultModel){
                deferred.resolve(defaultModel.data);
            }, function(error){
                deferred.reject(error);
            });
        }

        return deferred.promise;
    }

    return {
        getModel: function(){
            var deferred = $q.defer(),
                manifestsPromises = [];

            function loadManifest(module){
                var deferred = $q.defer();

                $http.get("widgets/" + module.id + "/" + module.id + ".manifest.json")
                    .success(function(manifest){
                        if (manifest.html){
                            angular.forEach(manifest.html, function(html, key){
                                manifest.html[key] = "widgets/" + module.id + "/" + html;
                            });
                        }

                        if (module.settings)
                            angular.extend(manifest.settings, module.settings);

                        angular.extend(module, manifest);

                        deferred.resolve(module);
                    })
                    .error(function(error){
                        deferred.reject(error);
                    });

                manifestsPromises.push(deferred.promise);
            }

            getModelData().then(function(modelData){
                angular.forEach(modelData, function(type){
                    angular.forEach(type, function(module){
                        if (angular.isArray(module))
                            angular.forEach(module, loadManifest);
                        else
                            loadManifest(module);
                    });
                });

                $q.all(manifestsPromises).then(function(){
                    model = modelData;
                    deferred.resolve(modelData);
                });
            });

            return deferred.promise;
        }
    }
}]);