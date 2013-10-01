angular.module("YouTube").controller("YouTubeController", ["$scope", "youtube", function($scope, youtube){
    function loadVideos(){
        youtube.notifications.getNotifications().then(function(data){
            $scope.items = data.notifications;
            $scope.$emit("load", { module: $scope.module, count: $scope.items.length });
        }, function(error){
            console.error(error);
        })
    }

    $scope.selectVideo = function(video){
        $scope.currentVideoEmbedUrl = "http://youtube.com/embed/" + video.id + "?autoplay=1";
        $scope.$emit("updateScroll");
    };

    $scope.$on("refresh", function(){
        youtube.notifications.getNotifications().then(function(data){
            $scope.items = data.notifications;
            $scope.$emit("load", { module: $scope.module, count: $scope.items.length });
        });
    });

    loadVideos();
}]);