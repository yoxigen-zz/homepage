angular.module("Homepage").controller("NotificationsController", ["$scope", function($scope){
    var notificationsService = angular.injector(["ng", 'Notifications']).get($scope.notification.id);
    if (notificationsService){
        if (!notificationsService.loggedIn){
            notificationsService.login().then(function(){
                notificationsService.getNotifications().then(function(notifications){
                    $scope.notification.items = notifications.items;
                    $scope.notification.unreadCount = notifications.unreadCount;
                    $scope.safeApply();
                })
            });
        }
    }
    else
        console.error("Notification service not found: ", $scope.notification.id);

    $scope.openNotifications = function(){
        if ($scope.notification.unreadCount){
            var unreadItems = [];
            angular.forEach($scope.notification.items, function(item){
                if (item.unread){
                    unreadItems.push(item.id);
                    item.unread = false;
                }
            });

            $scope.notification.unreadCount = 0;
        }

        notificationsService.markAsRead(unreadItems);
        $scope.toggleNotifications($scope.notification);
    }
}]);