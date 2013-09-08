angular.module("TopSites").controller("TopSitesController", ["$scope", "topSites", function($scope, topSites){
    topSites.getTopSites($scope.module.settings.maxItems).then(function(sites){
        $scope.topSites = sites;
        $scope.$emit("load", { module: $scope.module });
    });

    $scope.getItemThumbnail = function(item){
        return "chrome://favicon/" +  item.url;
    };
}]);