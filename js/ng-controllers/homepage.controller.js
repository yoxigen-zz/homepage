angular.module("Homepage").controller("HomepageController", ["$scope", "model", function($scope, model){
    model.getModel().then(function(modelData){
        $scope.notifications = modelData.notifications;
        $scope.widgets = modelData.widgets;
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
        itemsList: "partials/items_list.html?d=" + new Date().valueOf(),
        notifications: "partials/notifications.html?d=" + new Date().valueOf(),
        thumbnails: "partials/thumbnails.html?d=" + new Date().valueOf()
    };
}]);