angular.module("Homepage").controller("HomepageController", ["$scope", "model", "$timeout", "$window", "$q", function($scope, model, $timeout, $window, $q){
    var notificationsCount = 0,
        modelData;

    $q.all([model.getModel(), model.getLayout()]).then(function(data){
        setModel(data[0], data[1]);
    });

    model.onModelChange.addListener(function(e){
        setModel(e.model, e.layout);
    });

    function setModel(modelData, layoutData){
        $scope.notifications = modelData.notifications;
        $scope.widgets = modelData.widgets;
        $scope.columns = [];
        $scope.services = [];

        if(modelData.services && modelData.services.length){
            modelData.services.forEach(function(service){
                if (service.html)
                    $scope.services.push(service);
            })
        }

        $scope.layout = layoutData;
        $scope.layout.rows.forEach(function(row){
            row.height = row.height || (100 / $scope.layout.rows.length) + "%";
            row.columns.forEach(function(column){
                column.width = column.width || (100 / row.columns.length) + "%";
                column.widgets.forEach(function(widget, i){
                    column.widgets[i] = $scope.widgets[widget.index];
                    column.widgets[i].height = widget.height || (100 / column.widgets.length) + "%";
                });
            });
        });
    }

    $scope.callService = function(service, method, data){
        $scope.$broadcast(service, { method: method, data: data });
    };

    $scope.updateModel = function(){
        model.saveModel(modelData);
    };

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

    $scope.openModuleSettings = function(){
        $scope.callService("module_settings", "open");
    };

    $scope.background = {
        enabled: false,
        enable: function(){
            $scope.background.enabled = true;
        },
        disable: function(){
            $scope.background.enabled = false;
        }
    }
}]);