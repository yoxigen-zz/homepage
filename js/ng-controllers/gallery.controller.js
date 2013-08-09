angular.module("Homepage").controller("GalleryController", ["$scope", "imageCache", "$timeout", function($scope, imageCache, $timeout){
    if ($scope.items && $scope.items.length)
        setFirstItem();

    $scope.$on("onItems", function(e, data){
        if (data.items)
            setFirstItem();
    });

    $scope.selectItem = function(item){
        $scope.currentItem = item;
    };

    $scope.openItem = function(item){
        $scope.callService("viewer", "open", {
            items: $scope.items,
            currentItem: $scope.items.indexOf($scope.currentItem)
        });
    };

    function setFirstItem(){
        $scope.currentItem = $scope.items[0];
    }
}]);