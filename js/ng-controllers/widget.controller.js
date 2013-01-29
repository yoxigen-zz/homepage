angular.module("Homepage").controller("WidgetController", ["$scope", "$timeout", function($scope, $timeout){
    var timeoutPromise;


    $scope.trigger = function(eventName){
        $scope.$broadcast(eventName);
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