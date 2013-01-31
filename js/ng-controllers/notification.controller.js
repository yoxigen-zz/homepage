angular.module("Homepage").controller("NotificationsController", ["$scope", "$timeout", function($scope, $timeout){
    var notificationsService = angular.injector(["ng", 'Homepage']).get($scope.notification.id),
        timeoutPromise;

    function setNotifications(options){
        $timeout.cancel(timeoutPromise);
        $scope.loading = true;
        notificationsService.getNotifications(options).then(function(notifications){
            $scope.$emit("notificationsChange", { countChange: notifications.unreadCount - ($scope.notification.unreadCount || 0) });

            $scope.notification.items = notifications.items;
            $scope.notification.unreadCount = notifications.unreadCount;
            $scope.loading = false;

            if ($scope.notification.settings.refreshRate && angular.isNumber($scope.notification.settings.refreshRate))
                timeoutPromise = $timeout(setNotifications, $scope.notification.settings.refreshRate * 1000);

            $scope.safeApply();
        });
    }

    function setCurrentUser(){
        notificationsService.getCurrentUser().then(function(user){
            $scope.notification.user = user;
        });
    }

    if (notificationsService){
        if (notificationsService.loggedIn){
            setNotifications();
            setCurrentUser();
        }
    }
    else
        console.error("Notification service not found: ", $scope.notification.id);

    $scope.openNotifications = function(){
        if (!notificationsService.loggedIn){
            notificationsService.login().then(function(){
                setNotifications();
                setCurrentUser();
            });
        }
        else {
            if ($scope.notification.unreadCount){
                var unreadItems = [];
                angular.forEach($scope.notification.items, function(item){
                    if (item.unread){
                        unreadItems.push(item.id);
                        item.unread = false;
                    }
                });

                $scope.$emit("notificationsChange", { countChange: -1 * $scope.notification.unreadCount });
                $scope.notification.unreadCount = 0;
            }

            notificationsService.markAsRead(unreadItems);
        }
    };

    $scope.toggleItem = function(item){
        if ($scope.maximizedItem === item)
            $scope.maximizedItem = null;
        else
            $scope.maximizedItem = item;
    };

    $scope.refresh = setNotifications;
}]);