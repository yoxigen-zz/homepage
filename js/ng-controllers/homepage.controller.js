angular.module("Homepage").controller("HomepageController", ["$scope", "model", "$timeout", "$window", "$q", "users", function($scope, model, $timeout, $window, $q, users){
    var notificationsCount = 0,
        modelData,
        version = new Date(); // For debugging, remove when moving to production!!!

    $scope.currentUser = users.getCurrentUser();

    $scope.callService = function(service, method, data){
        $scope.$broadcast(service, { method: method, data: data });
    };

    $scope.updateSettings = function(){
        model.saveSettings(modelData);
    };

    $scope.onColumnLayoutChange = function(column, heights, refreshLayout){
        column.widgets.forEach(function(widget, i){
            widget.height = heights[i];
        });

        model.setLayout($scope.layout, refreshLayout);
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
                        modelType.splice(i, 1);
                        break;
                    }
                }
            }
        }
    };

    $scope.includes = {
        itemsList: "partials/items_list.html?v=" + version,
        gallery: "partials/gallery.html?v=" + version,
        notifications: "partials/notifications.html?v=" + version,
        settings: "partials/settings.html?v=" + version,
        thumbnails: "partials/thumbnails.html?d=" + version,
        widget: "partials/widget.html?d=" + version,
        options: "partials/options.html?d=" + version,
        userMenu: "partials/user_menu.html?v=" + version
    };

    $scope.$on("notificationsChange", function(e, data){
        notificationsCount += data.countChange;
        var title = "Homepage";
        if (notificationsCount > 0)
            title = "(" + notificationsCount + ") " + title;

        $scope.pageTitle = title;
    });

    $scope.$on("userLogin", function(e, data){
        window.location.reload();
        //$scope.currentUser = data.user;
        //loadLayout();
    });

    $scope.$on("userLogout", function(e, data){
        $scope.currentUser = null;
        loadLayout();
    });

    $scope.pageTitle = "Homepage";

    $scope.openModuleSettings = function(){
        $scope.callService("module_settings", "open");
    };

    var hideContentsTimeoutPromise;

    $scope.background = {
        enabled: false,
        enable: function(){
            $timeout.cancel(hideContentsTimeoutPromise);
            $scope.background.enabled = true;
            hideContentsTimeoutPromise = $timeout(function(){
                $scope.hideContents = true;
            }, 800);
        },
        disable: function(){
            $timeout.cancel(hideContentsTimeoutPromise);
            $scope.hideContents = false;
            $timeout(function(){
                $scope.background.enabled = false;
            });
        },
        toggle: function(){
            if (this.enabled)
                this.disable();
            else
                this.enable();
        }
    };

    $scope.sortOver = function(){
        //console.log("OVER: ", arguments);
    };

    $scope.updateLayout = function(){
        setTimeout(function(){
            $scope.$apply(function(){
                $scope.$broadcast("layoutUpdate");
            })
        }, 50);
    };

    loadLayout();

    window.addEventListener("online", function(e) {
        $scope.safeApply(function(){
            $scope.$broadcast("refresh");
        });
    });

    model.onModelChange.addListener(function(e){
        if (e.reload)
            window.location.reload();
        else{
            if (e.module.type === "widgets"){
                var columnWidgets = $scope.layout.rows[e.position.row].columns[e.position.column].widgets,
                    widgetHeight = (100 / (columnWidgets.length + 1)) + "%";

                $scope.widgets.push(e.module.data);
                columnWidgets.splice(0, 0, e.module.data);

                angular.forEach(columnWidgets, function(widget){
                    widget.height = widgetHeight;
                });

                e.module.data.isNewModule = true;

                $timeout(function(){
                    delete e.module.data.isNewModule;
                }, 1000);
            }
        }
    });

    function loadLayout(){
        $q.all([model.getModel(), model.getLayout()]).then(function(data){
            applyModelAndLayout(data[0], data[1]);

            // TODO: remove this line, it's temporary until 17/10/2013:
            model.fixModel();
        });
    }

    function findWidgetById(widgetId){
        for(var i= 0, widget; widget = $scope.widgets[i]; i++){
            if (widget.id === widgetId)
                return widget;
        }

        return null;
    }

    function applyModelAndLayout(_modelData, layoutData){
        modelData = _modelData;
        $scope.notifications = modelData.notifications;
        $scope.widgets = modelData.widgets;
        $scope.columns = [];
        $scope.services = [];
        $scope.background.widgets = modelData.background;

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
                    column.widgets[i] = findWidgetById(widget.id);
                    column.widgets[i].height = widget.height || (100 / column.widgets.length) + "%";
                });
            });
        });

        $scope.homepageLoaded = true;
    }
}]);