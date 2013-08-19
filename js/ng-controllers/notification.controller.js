angular.module("Homepage").controller("NotificationsController", ["$scope", "$timeout", function($scope, $timeout){
    var notificationsService = angular.injector(["ng", 'Homepage']).get($scope.notification.type),
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
        }, function(error){
            $scope.loading = false;
            console.error("Error getting notifications: ", error);
        });
    }

    function setCurrentUser(){
        notificationsService.getCurrentUser().then(function(user){
            $scope.notification.user = user;
        });
    }

    if (notificationsService){
        notificationsService.isLoggedIn().then(function(isLoggedIn){
            if (isLoggedIn){
                setNotifications();
                setCurrentUser();
            }
        });
    }
    else
        console.error("Notification service not found: ", $scope.notification.type);

    $scope.openNotifications = function(){
        notificationsService.isLoggedIn().then(function(isLoggedIn){
            if (!isLoggedIn){
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
        }, function(error){
            console.error("BAD: ", error);
        });
    };

    $scope.toggleItem = function(item){
        if ($scope.maximizedItem === item)
            $scope.maximizedItem = null;
        else
            $scope.maximizedItem = item;
    };

    $scope.refresh = setNotifications;
    $scope.$on("logout", function(){
        if (notificationsService.logout){
            notificationsService.logout();

            $scope.notification.items = [];
            $scope.notification.unreadCount = 0;
            $scope.notification.user = null;
            $scope.loading = false;
        }
    });
}]);