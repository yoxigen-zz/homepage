angular.module("ModuleSettings").controller("ModuleSettingsController", ["$scope", "moduleSettings", function($scope, moduleSettings){
    var methods = {
        open: function(data){
            $scope.moduleSettingsOpen = true;

            moduleSettings.getAllModules().then(function(modules){
                $scope.modules = modules;
            });
        }
    };

    $scope.addModule = function(module){
        moduleSettings.addModule(module);
    };

    $scope.$on($scope.service.type, function(e, eventData){
        methods[eventData.method] && methods[eventData.method](eventData.data);
    });

    $scope.setCurrentModule = function(module){
        $scope.currentModule = module;
        $scope.currentScreenshot = module.screenshots && module.screenshots[0];
    };
}]);