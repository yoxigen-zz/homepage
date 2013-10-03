angular.module("HomepageModel", ["Storage", "Utils", "EventBus", "HomepageUsers"]).factory("model", ["$q", "$http", "Storage", "utils", "EventBus", "$timeout", "users",
    function($q, $http, Storage, utils, EventBus, $timeout, users){
    var defaultModelUrl = "js/data/default_model.json",
        defaultLayoutUrl = "js/data/layout.json",
        model,
        storage = new Storage("homepageModel"),
        storageKeys = {
            LAYOUT_STORAGE_KEY: "homepage_layout",
            MODEL_STORAGE_KEY: "homepage_model",
            SETTINGS_STORAGE_KEY: "homepage_settings"
        },
        storageSettings,
        storageModel,
        storageLayout,
        eventBus = new EventBus(),
        setLayoutTimeoutPromise,
        loadedModuleTypes;

    if (window.homepageLoadedModuleTypes){
        loadedModuleTypes = window.homepageLoadedModuleTypes;
        delete window.homepageLoadedModuleTypes;
    }

    function getModelData (){
        var deferred = $q.defer();

        var storageType = users.getCurrentUser() ? storage.cloud : storage.local,
            storagePromises = [
                storageType.getItem(storageKeys.MODEL_STORAGE_KEY),
                storageType.getItem(storageKeys.SETTINGS_STORAGE_KEY)
            ];

        $q.all(storagePromises).then(function(data){
            storageModel = data[0];
            storageSettings = data[1];
            if (storageModel){
                deferred.resolve(getStorageModelData());
            }
            else{
                $http.get(defaultModelUrl).then(function(defaultModel){
                    if (users.getCurrentUser()){
                        storage.cloud.setItem(storageKeys.MODEL_STORAGE_KEY, defaultModel.data).then(function(cloudModel){
                            storageModel = cloudModel;

                            createSettings().then(function(){
                                deferred.resolve(defaultModel.data);
                            });
                        });
                    }
                    else{
                        storageModel = { attributes: defaultModel.data };
                        deferred.resolve(storageModel.attributes);
                    }
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
        if (!storageSettings){
            createSettings().then(withSettings);
        }
        else
            withSettings();

        function withSettings(){
            var modelStorageSettings = storageSettings.attributes.moduleSettings[model.id];
            if (modelStorageSettings){
                if (!model.settings)
                    model.settings = modelStorageSettings;
                else
                    angular.extend(model.settings, modelStorageSettings);
            }
        }
    }

    function getModuleFilePath(moduleType, moduleName, file){
        return ["modules", moduleType, moduleName, file].join("/");
    }

    function getStorageModelData(){
        return storageModel.getData ? storageModel.getData() : storageModel.attributes;
    }

    function getUniqueModuleId(){
        var randomStr = utils.strings.getRandomString(6),
            moduleType,
            idExists = false,
            modelData = getStorageModelData();

        for(var moduleTypeName in modelData){
            moduleType = modelData[moduleTypeName];
            moduleType.every(function(module){
                if (module.id === randomStr){
                    idExists = true;
                    return false;
                }
                return true;
            });

            if (idExists)
                break;
        }

        if (idExists)
            randomStr = getUniqueModuleId();

        return randomStr;
    }

    function getMostAvailableColumn(){
        var result;
        storageLayout.attributes.rows.forEach(function(row, rowIndex){
            row.columns.forEach(function(column, columnIndex){
                if (!result || column.widgets.length < result.column.widgets.length){
                    result = {
                        column: column,
                        row: row,
                        columnIndex: columnIndex,
                        rowIndex: rowIndex
                    };
                }
            })
        });

        return result;
    }

    function createSettings(settings){
        var deferred = $q.defer();

        if (users.getCurrentUser()){
            storage.cloud.setItem(storageKeys.SETTINGS_STORAGE_KEY, { moduleSettings: settings || {}}).then(function(cloudSettings){
                storageSettings = cloudSettings;
                deferred.resolve(storageSettings);
            });
        }
        else{
            storageSettings = { attributes: { moduleSettings: settings || {}}};
            storage.local.setItem(storageKeys.SETTINGS_STORAGE_KEY, storageSettings);
        }

        return deferred.promise;
    }

    return {
        addModule: function(type, moduleType){
            var module = { type: moduleType, id: getUniqueModuleId() },
                modelModuleType = angular.copy(getStorageModelData()[type]),
                widgetPosition;

            modelModuleType.push(module);

            if (users.getCurrentUser())
                storageModel.set(type, modelModuleType);
            else
                storageModel.attributes[type] = modelModuleType;

            if (type === "widgets"){
                var availablePosition = getMostAvailableColumn();
                var column = availablePosition.column;
                widgetPosition = { row: availablePosition.rowIndex, column: availablePosition.columnIndex };

                column.widgets.forEach(function(widget){
                    delete widget.height;
                });

                column.widgets.splice(0, 0, { id: module.id });
            }

            this.getModel(getStorageModelData()).then(function(modulesData){
                var module = modulesData[type][modulesData[type].length - 1],
                    resources = [];

                if (module.resources){
                    module.resources.forEach(function(resource){
                        resources.push(getModuleFilePath(type, module.type, resource));
                    });
                }

                if (module.modules){
                    module.modules.forEach(function(ngModule){
                        angular.module(ngModule.name, ngModule.dependencies || []);
                    });
                }

                if (!~loadedModuleTypes.indexOf(module.type)){
                    requirejs(resources, function() {
                        //self.destroy();
                        //angular.bootstrap(document, ["Homepage"]);
                        eventBus.triggerEvent("onModelChange", { reload: true, added: { type: type, module: module }, model: modulesData, layout: storageLayout });
                    });
                }
                else{
                    eventBus.triggerEvent("onModelChange", { reload: false, module: { type: type, data: module }, model: modulesData, layout: storageLayout, position: widgetPosition });
                }
                //eventBus.triggerEvent("onModelChange", { added: { type: type, module:  }, model: modulesData, layout: storageLayout });
            });

            if (users.getCurrentUser()){
                storageModel.save();
                storageLayout.update();
            }
            else{
                $q.all([
                    storage.local.setItem(storageKeys.MODEL_STORAGE_KEY, storageModel),
                    storage.local.setItem(storageKeys.LAYOUT_STORAGE_KEY, storageLayout)
                ]).then(function(){ console.log("SAVED MODELS!") });
            }
        },
        destroy: function(){
            storage.destroy();
            storage = null;
            model = null;
        },
        getLayout: function(){
            var deferred = $q.defer();

            if (users.getCurrentUser()){
                storage.cloud.getItem(storageKeys.LAYOUT_STORAGE_KEY).then(function(layoutData){
                    if (layoutData){
                        storageLayout = layoutData;
                        deferred.resolve(layoutData.getData ? layoutData.getData() : layoutData.attributes);
                    }
                    else{
                        $http.get(defaultLayoutUrl)
                            .success(function(data){
                                storage.cloud.setItem(storageKeys.LAYOUT_STORAGE_KEY, data).then(function(cloudLayout){
                                    storageLayout = cloudLayout;
                                    deferred.resolve(data);
                                });
                            })
                            .error(function(error){
                                deferred.reject(error);
                            });
                    }
                }, deferred.reject);
            }
            else{
                storage.local.getItem(storageKeys.LAYOUT_STORAGE_KEY).then(function(layoutData){
                    if (layoutData){
                        storageLayout = layoutData;
                        deferred.resolve(angular.copy(layoutData.attributes));
                    }
                    else{
                        $http.get(defaultLayoutUrl)
                            .success(function(data){
                                var layoutData = { attributes: data };
                                storage.local.setItem(storageKeys.LAYOUT_STORAGE_KEY, layoutData);
                                storageLayout = layoutData;
                                deferred.resolve(angular.copy(layoutData.attributes));
                            })
                            .error(function(error){
                                deferred.reject(error);
                            });
                    }
                }, deferred.reject);
            }
            return deferred.promise;
        },
        getModel: function(modelData){
            var deferred = $q.defer(),
                manifestsPromises = [];

            function loadManifest(module, moduleType){
                var deferred = $q.defer();

                $http.get(getModuleFilePath(moduleType, module.type, module.type + ".manifest.json"))
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

            function withModelData(modelData){
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
            }

            if (modelData)
                withModelData(modelData);
            else
                getModelData().then(withModelData);

            return deferred.promise;
        },
        getUsedModuleTypes: function(){
            var deferred = $q.defer();

            var usedModuleIds = [];
            angular.forEach(getStorageModelData(), function(moduleType){
                moduleType.forEach(function(module){
                    usedModuleIds.push(module.type);
                })
            });

            deferred.resolve(usedModuleIds);
            return deferred.promise;
        },
        onModelChange: eventBus.getEventPair("onModelChange"),
        removeModule: function(moduleToRemove){
            // Remove the module from model
            var foundModule,
                moduleType,
                storageData = getStorageModelData();

            for(var moduleTypeName in storageData){
                moduleType = storageData[moduleTypeName];
                for(var i= 0, module; module = moduleType[i]; i++){
                    if (module.id === moduleToRemove.id){
                        moduleType.splice(i, 1);
                        foundModule = true;
                        break;
                    }
                }
                if (foundModule)
                    break;
            }

            if (users.getCurrentUser()){
                storageModel.update();
                var storageModelData = getStorageModelData();
                if (storageModelData.moduleSettings && storageModelData.moduleSettings[moduleToRemove.id]){
                    delete storageSettings.attributes.moduleSettings[moduleToRemove.id];
                    storageSettings.update();
                }
            }
            else{
                storage.local.setItem(storageKeys.MODEL_STORAGE_KEY, storageModel);
                if (storageSettings.attributes[moduleToRemove.id]){
                    delete storageSettings.attributes[moduleToRemove.id];
                    storage.local.setItem(storageKeys.SETTINGS_STORAGE_KEY, storageSettings);
                }
            }

            // In case of a widget, need to also remove it from the layout:
            if (moduleTypeName === "widgets"){
                // Remove module from layout and use the freed space in other modules
                foundModule = false;
                storageLayout.attributes.rows.every(function(row){
                    row.columns.every(function(column){
                        column.widgets.every(function(widget, widgetIndex){
                            if (widget.id === moduleToRemove.id){
                                var leftOverHeight = 100 - (parseFloat(widget.height) || (100 / column.widgets.length)),
                                    remainingWidgetsHeightRatio = 100 / leftOverHeight;

                                column.widgets.splice(widgetIndex, 1);
                                column.widgets.forEach(function(widget){
                                    widget.height = (parseFloat(widget.height) * remainingWidgetsHeightRatio) + "%";
                                });
                                foundModule = true;
                            }
                            return !foundModule;
                        });
                        return !foundModule;
                    });
                    return !foundModule;
                });

                if (users.getCurrentUser())
                    storageLayout.update();
                else
                    storage.local.setItem(storageKeys.LAYOUT_STORAGE_KEY, storageLayout);
            }
        },
        saveSettings: function(settingsData){
            var newSettings = !storageSettings;

            if (newSettings){
                var settings = {};

                for(var namespace in settingsData){
                    settingsData[namespace].forEach(function(module){
                        settings[module.id] = module.settings;
                    });
                }
            }
            else{
                for(var namespace in settingsData){
                    settingsData[namespace].forEach(function(module){
                        storageSettings.attributes.moduleSettings[module.id] = module.settings;
                    });
                }
            }

            if (newSettings){
                createSettings(settings);
            }
            else{
                if (users.getCurrentUser())
                    return storageSettings.update();
                else
                    return storage.local.setItem(storageKeys.SETTINGS_STORAGE_KEY, storageSettings);
            }
        },
        setLayout: function(layout, refreshLayout){
            $timeout.cancel(setLayoutTimeoutPromise);
            setLayoutTimeoutPromise = $timeout(function(){
                var newStorageLayout = { rows: [] };
                layout.rows.forEach(function(row){
                    var rowData = { columns: [] };
                    row.columns.forEach(function(column){
                        var columnData = { widgets: [] };
                        column.widgets.forEach(function(widget){
                            var widgetData = { id: widget.id, height: widget.height };
                            columnData.widgets.push(widgetData);
                        })
                        rowData.columns.push(columnData);
                    })
                    newStorageLayout.rows.push(rowData);
                });

                if (users.getCurrentUser()){
                    for(var property in newStorageLayout){
                        storageLayout.set(property, newStorageLayout[property]);
                    }
                    storageLayout.save();
                }
                else{
                    storage.local.setItem(storageKeys.LAYOUT_STORAGE_KEY, { attributes: newStorageLayout });
                }
            }, 500);
        }
    }
}]);