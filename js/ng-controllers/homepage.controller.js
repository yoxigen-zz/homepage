angular.module("Homepage").controller("HomepageController", ["$scope", "model", "$timeout", "$window", "$q", function($scope, model, $timeout, $window, $q){
    var notificationsCount = 0,
        widgetMinWidth = 500,
        columnsCount = 1;

    $q.all([model.getLayout(), model.getModel()]).then(function(data){
        var modelData = data[1];

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

        $scope.layout = data[0];
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
    });

    $scope.callService = function(service, method, data){
        $scope.$broadcast(service, { method: method, data: data });
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

    /*
    var loadTimeoutPromise,
        loadedModules = 0,
        widgetMinHeight = 250;

    function onLoadAllModules(){
            columnsCount = 3; //Math.min(Math.floor(document.documentElement.clientWidth / widgetMinWidth), $scope.widgets.length) || 1;
            var modulesWrappers = document.querySelectorAll(".module-wrapper");
            var columnHeight = document.getElementById("content").clientHeight,
                totalWidgetsHeight = 0,
                moduleHeights = [];

            angular.forEach(modulesWrappers, function(module){
                module.style.removeProperty("height");
            });

            var modules = document.querySelectorAll(".module-content-scroll");
            angular.forEach(modules, function(module, i){
                var fixedHeight = Math.max(widgetMinHeight, Math.min(module.scrollHeight, columnHeight));
                moduleHeights.push({ height: fixedHeight, moduleWrapper: modulesWrappers[i] });
                totalWidgetsHeight += fixedHeight;
            });

            $scope.columns = [];
            $scope.columnWidth = (100 / columnsCount) + "%";

            for(var i= 0; i < columnsCount; i++){
                $scope.columns.push([]);
            }

            stopOnLoad();

            if (columnsCount === 1){
                angular.forEach($scope.widgets, function(widget, i){
                    widget.height = moduleHeights[i].height + "px";
                    $scope.columns[0].push(widget);
                });
                console.log("columns: ", $scope.columns)
            }
            else {
                var averageHeightPerColumn =  totalWidgetsHeight / columnsCount,
                    widgetPercent;

                for(var i= 0, j, currentWidgetIndex = 0, columnWidgetCount = 0, currentColumnTotalHeight = 0, startWidget, column; column = $scope.columns[i]; i++){
                    startWidget = currentWidgetIndex;
                    while(currentColumnTotalHeight <= averageHeightPerColumn && currentWidgetIndex < moduleHeights.length){
                        currentColumnTotalHeight += moduleHeights[currentWidgetIndex].height;
                        column.push($scope.widgets[currentWidgetIndex]);
                        currentWidgetIndex++;
                        columnWidgetCount++;
                    }

                    for(j = startWidget; j < currentWidgetIndex; j++){
                        widgetPercent = moduleHeights[j].height / currentColumnTotalHeight;
                        $scope.widgets[j].height = ((widgetPercent) * 100) + "%";
                    }
                     console.log($scope.columns);
                    currentColumnTotalHeight = 0;
                    columnWidgetCount = 0;
                }
            }
    }

    var stopOnLoad = $scope.$on("load", function(e, data){
        $timeout.cancel(loadTimeoutPromise);
        loadedModules++;
        if (loadedModules === $scope.widgets.length)
            onLoadAllModules();
        else{
            loadTimeoutPromise = $timeout(onLoadAllModules, 1000);
        }
    });

    $window.addEventListener("resize", function(){
        $timeout.cancel(loadTimeoutPromise);
        loadTimeoutPromise = $timeout(onLoadAllModules, 200);
    });
    */
}]);