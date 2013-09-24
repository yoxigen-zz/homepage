angular.module("Homepage").controller("WidgetController", ["$scope", "$timeout", function($scope, $timeout){
    var timeoutPromise,
        updateSettingsTimeoutPromise;

    $scope.trigger = function(eventName){
        $scope.$broadcast(eventName);
    };

    $scope.settings = {
        broadcast: function(event, data){
            $scope.$broadcast(event, data);
        },
        close: function(){
            $scope.settingsEnabled = false;
        },
        getSettingTemplateId: function(setting){
            return "setting." + setting.type;
        },
        onUpdate: function(setting){
            $timeout.cancel(updateSettingsTimeoutPromise);
            updateSettingsTimeoutPromise = $timeout(function(){
                $scope.updateSettings(setting);
                $scope.$broadcast("updateSettings", { setting: setting, value: $scope.module.settings[setting.name] })
            }, 500);
        }
    };

    if ($scope.module.settings && $scope.module.settings.refreshRate){
        $scope.refresh = function(){
            $scope.loading = true;
            $timeout.cancel(timeoutPromise);
            $scope.$broadcast("refresh");
        };

        $scope.$on("load", endLoading);
        $scope.$on("loadError", endLoading);
    }

    function endLoading(){
        $scope.loading = false;
        timeoutPromise = $timeout($scope.refresh, $scope.module.settings.refreshRate * 1000);
    }
}]);