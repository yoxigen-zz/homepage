angular.module("ModuleSettings").controller("ModuleSettingsController", ["$scope", "moduleSettings", function($scope, moduleSettings){
    var methods = {
        open: function(data){
            $scope.moduleSettingsOpen = true;

            if (!$scope.modules){
                moduleSettings.getAllModules().then(function(modules){
                    $scope.modules = modules;
                });
            }
        }
    };

    $scope.$on($scope.service.id, function(e, eventData){
        methods[eventData.method] && methods[eventData.method](eventData.data);
    });
}]);