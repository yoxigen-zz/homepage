angular.module("Homepage").controller("HomepageController", ["$scope", "model", function($scope, model){
    var notificationsCount = 0;

    model.getModel().then(function(modelData){
        $scope.notifications = modelData.notifications;
        $scope.widgets = modelData.widgets;
    });

    $scope.includes = {
        itemsList: "partials/items_list.html?d=" + new Date().valueOf(),
        notifications: "partials/notifications.html",
        settings: "partials/settings.html",
        thumbnails: "partials/thumbnails.html?d=" + new Date().valueOf(),
        widget: "partials/widget.html?d=" + new Date().valueOf()
    };

    $scope.$on("notificationsChange", function(e, data){
        notificationsCount += data.countChange;
            var title = "Homepage";
            if (notificationsCount > 0)
                title = "(" + notificationsCount + ") " + title;

        $scope.pageTitle = title;
    });

    $scope.pageTitle = "Homepage";
}]);