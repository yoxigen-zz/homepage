angular.module("Homepage").controller("SettingsController", ["$scope", function($scope){
    function getSetting(settingName){
        return $scope.module.settings[settingName];
    }
    function setSetting(settingName, value){
        return $scope.module.settings[settingName] = value;
    }

    $scope.addStringToArraySetting = function(settingName, str){
        var setting = getSetting(settingName);
        if (!setting)
            setting = setSetting(settingName, [str]);
        else
            setting.push(str);

        $scope.settings.onUpdate(setting)
    };

    $scope.removeStringFromArraySetting = function(settingName, index){
        var setting = getSetting(settingName);
        if (confirm("Are you sure you wish to remove feed \"" + setting[index] + "\"?")){
            setting.splice(index, 1);
            $scope.settings.onUpdate(setting)
        }
    }
}]);