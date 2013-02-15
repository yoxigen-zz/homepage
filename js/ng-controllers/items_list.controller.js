angular.module("Homepage").controller("ItemsListController", ["$scope", function($scope){
    var currentOpenItem;
    $scope.toggleItem = function(item){
        if (currentOpenItem)
            currentOpenItem.isOpen = false;

        if (item !== currentOpenItem){
            currentOpenItem = item;
            item.isOpen = true;
        }
        else
            currentOpenItem = null;
    };
}]);