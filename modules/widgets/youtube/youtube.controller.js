angular.module("YouTube").controller("YouTubeController", ["$scope", "youtube", function($scope, youtube){
    $scope.showNotifications = function(){
        youtube.notifications.getNotifications().then(function(data){
            $scope.items = data.notifications;
        }, function(error){
            console.error(error);
        })
    };

    $scope.selectVideo = function(video){
        $scope.currentVideoEmbedUrl = "http://youtube.com/embed/" + video.id + "?autoplay=1";
    }
}]);