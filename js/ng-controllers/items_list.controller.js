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

    $scope.openItem = function(item){
        if (item.text){
            $scope.callService("article", "open", {
                article: item
            });
        }
        else{
            window.open(item.link);
        }
    }
}]);