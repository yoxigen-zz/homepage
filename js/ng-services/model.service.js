angular.module("HomepageModel", ["Storage"]).factory("model", ["$q", "$http", "Storage", function($q, $http, Storage){
    var defaultModelUrl = "js/data/default_model.json",
        model,
        storage = new Storage("homepageModel");

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
        destroy: function(){
            storage.destroy();
            storage = null;
            model = null;
        },
        getLayout: function(){
            var deferred = $q.defer();

            $http.get("js/data/layout.json")
                .success(function(data){
                    deferred.resolve(data);
                })
                .error(function(error){
                    deferred.reject(error);
                });

            return deferred.promise;
        },
        getModel: function(){
            var deferred = $q.defer(),
                manifestsPromises = [];

            function loadManifest(module, moduleType){
                var deferred = $q.defer();

                $http.get("modules/" + moduleType + "/" + module.id + "/" + module.id + ".manifest.json")
                    .success(function(manifest){
                        if (manifest.html){
                            angular.forEach(manifest.html, function(html, key){
                                manifest.html[key] = ["modules", moduleType, module.id, html].join("/");
                            });
                        }

                        if (manifest.icon && !/^https?:\/\//.test(manifest.icon))
                            manifest.icon = ["modules", moduleType, module.id, manifest.icon].join("/");

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
                angular.forEach(modelData, function(type, typeName){
                    angular.forEach(type, function(module){
                        if (angular.isArray(module)){
                            angular.forEach(module, function(module){
                                loadManifest(module, typeName);
                            });
                        }
                        else
                            loadManifest(module, typeName);
                    });
                });

                $q.all(manifestsPromises).then(function(){
                    model = modelData;
                    deferred.resolve(modelData);
                });
            });

            return deferred.promise;
        },
        getUsedModulesIds: function(){
            var deferred = $q.defer();

            this.getModel().then(function(modelData){
                var usedModulesIds = [];
                for(var moduleType in modelData){
                    modelData[moduleType].forEach(function(module){
                        usedModulesIds.push(module.id);
                    });
                }

                deferred.resolve(usedModulesIds);
            }, function(error){
                deferred.reject(error);
            });

            return deferred.promise;
        }
    }
}]);