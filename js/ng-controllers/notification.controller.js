angular.module("Homepage").controller("NotificationsController", ["$scope", function($scope){
    var notificationsService = angular.injector(["ng", 'Notifications']).get($scope.notification.id);

    function setNotifications(){
        notificationsService.getNotifications().then(function(notifications){
            $scope.notification.items = notifications.items;
            $scope.notification.unreadCount = notifications.unreadCount;
            $scope.safeApply();
        });
    }

    if (notificationsService){
        if (notificationsService.loggedIn)
            setNotifications();

    }
    else
        console.error("Notification service not found: ", $scope.notification.id);

    $scope.openNotifications = function(){
        if (!notificationsService.loggedIn){
            notificationsService.login().then(function(){
                setNotifications();
                notificationsService.getCurrentUser().then(function(user){
                    $scope.notification.user = user;
                });
            });
        }
        else{
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
    }
}]);