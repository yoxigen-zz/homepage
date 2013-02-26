angular.module("ModuleSettings").factory("moduleSettings", ["$q", "$http", "model", function($q, $http, model){
    var modulesDataUrl = "js/data/modules.json";

    return {
        addModule: function(module){
            if (module.allowMultiple || !module.used)
                model.addModule(module.types[0], module.id);
        },
        /**
         * Returns all the available modules, which can be added to Homepage.
         * @return {*}
         */
        getAllModules: function(){
            var deferred = $q.defer();

            $q.all([$http.get(modulesDataUrl), model.getUsedModuleTypes()]).then(function(results){
                var allModules = results[0].data,
                    usedModuleTypes = results[1];

                allModules.forEach(function(module){
                    var found = usedModuleTypes.indexOf(module.id);

                    if (~found){
                        module.used = true;
                        usedModuleTypes.splice(found, 1);
                    }
                });
                deferred.resolve(allModules);

            }, function(error){
                deferred.reject(error);
            });

            return deferred.promise;
        }
    };
}]);