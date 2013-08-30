angular.module("Homepage").directive("layoutColumn", ["$parse", function($parse){
    return {
        restrict: "C",
        scope: false,
        link: function($scope, element, attr){
            var fn = $parse(attr["onLayoutChange"]),
                currentPosition,
                draggerClass = "module-resize-drag",
                columnModules,
                moduleMinHeight = 100,
                currentModule,
                nextModule,
                columnHeight;

            function setModules(){
                columnModules = element[0].querySelectorAll(".module-wrapper");
                angular.forEach(columnModules, function(module, i){
                    if (i < columnModules.length - 1 ){
                        if (!module.dragger){
                            var dragger = document.createElement("div");
                            dragger.className = draggerClass;
                            dragger.moduleIndex = i;
                            module.appendChild(dragger);
                            dragger.addEventListener("mousedown", onMouseDown);
                            module.dragger = dragger;
                        }
                    }
                    else if (module.dragger){
                        module.removeChild(module.dragger);
                        module.dragger = null;
                    }
                });
            }

            setTimeout(function(){
                setModules();
            }, 400);

            function fixHeights(){
                var totalColumnHeight = 0,
                    columnHeight = element[0].clientHeight,
                    finalTotalModulesHeightPercent = 0;

                angular.forEach(columnModules, function(widget, i){
                    totalColumnHeight += widget.clientHeight;
                });

                if (totalColumnHeight !== columnHeight){
                    angular.forEach(columnModules, function(widget){
                        var finalWidgetHeight = Math.max(columnHeight * (widget.clientHeight / totalColumnHeight), moduleMinHeight),
                            finalWidgetHeightPercent = 100 * (finalWidgetHeight / columnHeight);

                        finalTotalModulesHeightPercent += finalWidgetHeightPercent;
                        widget.style.height = finalWidgetHeightPercent + "%";
                    });

                   if (finalTotalModulesHeightPercent){
                       angular.forEach(columnModules, function(widget){
                           widget.style.height = (100 *  parseFloat(widget.style.height) / finalTotalModulesHeightPercent) + "%";
                       });
                   }
                }
            }

            $scope.$on("layoutUpdate", function(){
                setTimeout(function(){
                    setModules()
                    fixHeights();
                    applyHeights({ refreshLayout: true });
                }, 50)
            });

            function applyHeights(options){
                options = options || {};
                var heights = [];
                angular.forEach(columnModules, function(module){
                    heights.push(module.style.height);
                });
                fn($scope, angular.extend({ heights: heights }, options));
            }
            function onMouseMove(e){
                var deltaY = e.y - currentPosition.y,
                    currentHeight = currentModule.clientHeight,
                    currentModuleHeight = currentHeight + deltaY,
                    nextModuleHeight;

                if (currentModuleHeight >= moduleMinHeight){
                    nextModuleHeight = nextModule.clientHeight - deltaY;
                    if (nextModuleHeight >= moduleMinHeight){
                        currentModule.style.height = (100 * currentModuleHeight / columnHeight) + "%";
                        nextModule.style.height = (100 * nextModuleHeight / columnHeight) + "%";
                    }
                }

                currentPosition = { x:e.x, y:e.y };
            }

            function onMouseUp(e){
                e.stopPropagation();
                e.preventDefault();

                window.removeEventListener("mousemove", onMouseMove);
                document.documentElement.removeEventListener("mouseup", onMouseUp);
                currentPosition = null;
                currentModule = null;
                nextModule = null;

                $scope.$apply(applyHeights);
            }

            function onMouseDown(event){
                currentPosition = { x: event.x, y: event.y };
                currentModule = event.target.parentNode;
                nextModule = currentModule.nextSibling;
                columnHeight = element[0].clientHeight;
                event.stopPropagation();
                event.preventDefault();
                window.addEventListener("mousemove", onMouseMove);
                document.documentElement.addEventListener("mouseup", onMouseUp);
            }
        }
    };
}]);