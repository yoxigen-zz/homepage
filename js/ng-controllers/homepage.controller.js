angular.module("Homepage").controller("HomepageController", ["$scope", "model", "$timeout", "$window", "$q", function($scope, model, $timeout, $window, $q){
    var notificationsCount = 0,
        modelData;

    $q.all([model.getModel(), model.getLayout()]).then(function(data){
        setModel(data[0], data[1]);
    });

    model.onModelChange.addListener(function(e){
        setModel(e.model, e.layout);
    });

    function setModel(_modelData, layoutData){
        modelData = _modelData;
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

        function findWidgetById(widgetId){
            for(var i= 0, widget; widget = $scope.widgets[i]; i++){
                if (widget.id === widgetId)
                    return widget;
            }

            return null;
        }

        $scope.layout = layoutData;
        $scope.layout.rows.forEach(function(row){
            row.height = row.height || (100 / $scope.layout.rows.length) + "%";
            row.columns.forEach(function(column){
                column.width = column.width || (100 / row.columns.length) + "%";
                column.widgets.forEach(function(widget, i){
                    column.widgets[i] = findWidgetById(widget.id);
                    column.widgets[i].height = widget.height || (100 / column.widgets.length) + "%";
                });
            });
        });
    }

    $scope.callService = function(service, method, data){
        $scope.$broadcast(service, { method: method, data: data });
    };

    $scope.updateSettings = function(){
        model.saveSettings(modelData);
    };

    $scope.onColumnLayoutChange = function(column, heights){
        heights.forEach(function(moduleHeight, i){
            column.widgets[i].height = moduleHeight;
        });
        model.setLayout($scope.layout);
    };

    $scope.removeModule = function(module, moduleTypeName){
        if (window.confirm("Are you sure you want to remove this module?")){
            model.removeModule(module);

            if (moduleTypeName === "widgets"){
                var found = false;
                $scope.layout.rows.every(function(row){
                    row.columns.every(function(column){
                        column.widgets.every(function(widget, i){
                            if (widget === module){
                                var leftOverHeight = 100 - (parseFloat(widget.height) || (100 / column.widgets.length)),
                                    remainingWidgetsHeightRatio = 100 / leftOverHeight;

                                column.widgets.splice(i, 1);
                                column.widgets.forEach(function(widget){
                                    widget.height = (parseFloat(widget.height) * remainingWidgetsHeightRatio) + "%";
                                });
                                found = true;
                            }
                            return !found;
                        });
                        return !found;
                    });
                    return !found;
                });
            }
            else{
                var modelType = modelData[moduleTypeName];
                for(var i= 0, _module; _module = modelType[i]; i++){
                    if (_module === module){

                    }
                }
            }
        }
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