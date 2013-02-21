angular.module("Article").controller("ArticleController", ["$scope", "$timeout", function($scope, $timeout){
    $scope.articleOpen = false;

    var methods = {
        open: function(data){
            $scope.article = data.article;
            $scope.articleOpen = true;
        }
    };

    $scope.$on($scope.service.id, function(e, eventData){
        methods[eventData.method] && methods[eventData.method](eventData.data);
    });

    $scope.closeArticle = function(){
        $scope.article = null;
        $scope.articleOpen = false;
    };

    $scope.$on("modalClose", $scope.closeArticle);
}]);