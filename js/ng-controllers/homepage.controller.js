angular.module("Homepage").controller("HomepageController", ["$scope", "homepageData", function($scope, homepageData){
    homepageData.getData().then(function(data){
        $scope.notifications = data.notifications;
        $scope.widgets = data.widgets;
    });

    var currentNotificationsType;
    $scope.toggleNotifications = function(notificationsType){
        if (currentNotificationsType){
            if (currentNotificationsType !== notificationsType){
                currentNotificationsType.open = false;
                notificationsType.open = true;
                currentNotificationsType = notificationsType;
            }
            else{
                notificationsType.open = false;
                currentNotificationsType = null;
            }

        }
        else{
            notificationsType.open = true;
            currentNotificationsType = notificationsType;
        }
    };

    $scope.includes = {
        itemsList: "partials/items_list.html",
        notifications: "partials/notifications.html",
        thumbnails: "partials/thumbnails.html"
    };
}]);