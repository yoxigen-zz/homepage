angular.module("HomepageModel", ["Storage"]).factory("model", ["$q", "$http", "Storage", function($q, $http, Storage){
    var defaultModelUrl = "js/data/default_model.json",
        model,
        storage = new Storage("homepageModel"),
        storageKeys = {
            MODEL_STORAGE_KEY: "homepage_model",
            SETTINGS_STORAGE_KEY: "homepage_settings"
        },
        storageSettings;

    function getModelData (){
        var deferred = $q.defer();

        $q.all([storage.cloud.getItem(storageKeys.MODEL_STORAGE_KEY), storage.cloud.getItem(storageKeys.SETTINGS_STORAGE_KEY)]).then(function(data){
            var storageModel = data[0];
            storageSettings = data[1] || {};
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
        }, function(error){
            console.error(error);
        });

        return deferred.promise;
    }

    function applyStorageSettingsToModel(model){
        var modelStorageSettings = storageSettings[model.id];
        if (modelStorageSettings){
            if (!model.settings)
                model.settings = modelStorageSettings;
            else
                angular.extend(model.settings, modelStorageSettings);
        }
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

                $http.get("modules/" + moduleType + "/" + module.type + "/" + module.type + ".manifest.json")
                    .success(function(manifest){
                        if (manifest.html){
                            angular.forEach(manifest.html, function(html, key){
                                manifest.html[key] = ["modules", moduleType, module.type, html].join("/");
                            });
                        }

                        if (manifest.icon && !/^https?:\/\//.test(manifest.icon))
                            manifest.icon = ["modules", moduleType, module.type, manifest.icon].join("/");

                        if (module.settings)
                            angular.extend(manifest.settings, module.settings);

                        angular.extend(module, manifest);
                        applyStorageSettingsToModel(module);

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
                        usedModulesIds.push(module.type);
                    });
                }

                deferred.resolve(usedModulesIds);
            }, function(error){
                deferred.reject(error);
            });

            return deferred.promise;
        },
        saveModel: function(modelData){
            var settings = {};
            for(var namespace in modelData){
                modelData[namespace].forEach(function(module){
                    settings[module.id] = module.settings;
                });
            }

            storage.cloud.setItem(storageKeys.SETTINGS_STORAGE_KEY, settings).then(function(){
                console.log("SUCCESS writing!");
            });
        }
    }
}]);