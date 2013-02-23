angular.module("Homepage").directive("onVerticalDrag", ["$parse", function($parse){
    return {
        restrict: "A",
        scope: false,
        link: function($scope, element, attr){
            var fn = $parse(attr["onVerticalDrag"]),
                onMouseMove = function(e){
                    $scope.$apply(function() {
                        fn($scope, { $event: { x:e.x - currentPosition.x, y:e.y - currentPosition.y } });
                    });
                    currentPosition = { x:e.x, y:e.y };
                },
                currentPosition;

            function onMouseUp(e){
                e.stopPropagation();
                e.preventDefault();
                window.removeEventListener("mousemove", onMouseMove);
                document.documentElement.removeEventListener("mouseup", onMouseUp);
                currentPosition = null;
            }

            element.bind("mousedown", function(event) {
                currentPosition = { x: event.x, y: event.y };
                event.stopPropagation();
                event.preventDefault();
                window.addEventListener("mousemove", onMouseMove);
                document.documentElement.addEventListener("mouseup", onMouseUp);
            });
        }
    };
}]);