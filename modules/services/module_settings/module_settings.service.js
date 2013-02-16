angular.module("ModuleSettings").factory("moduleSettings", ["$q", "$http", "model", function($q, $http, model){
    var modulesDataUrl = "js/data/modules.json";

    return {
        /**
         * Returns all the available modules, which can be added to Homepage.
         * @return {*}
         */
        getAllModules: function(){
            var deferred = $q.defer();

            $q.all([$http.get(modulesDataUrl), model.getUsedModulesIds()]).then(function(results){
                var allModules = results[0].data,
                    usedModuleIds = results[1];

                allModules.forEach(function(module){
                    var found = usedModuleIds.indexOf(module.id);

                    if (~found){
                        module.used = true;
                        usedModuleIds.splice(found, 1);
                    }
                    deferred.resolve(allModules);
                });
            }, function(error){
                deferred.reject(error);
            });

            return deferred.promise;
        }
    };
}]);