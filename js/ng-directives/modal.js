angular.module("Homepage").directive("modal", function(){
    return {
        restrict: "E",
        template: ['<div class="modal" ng-show="modalOpen" ng-cloak>',
                  '<div class="modal-background"></div>',
                  '<div class="modal-contents closes-modal" ng-transclude>',
                  '</div></div>'].join(""),
        transclude: true,
        replace: true,
        require: '?ngModel',
        link: function($scope, element, attrs, ngModel){
            element[0].addEventListener("click", function(e){
                if (e.target.classList.contains("closes-modal")){
                    $scope.$apply(function(){
                        $scope.modalOpen = false;
                        ngModel.$setViewValue(false);
                    });
                }
            });

            ngModel.$render = function() {
                $scope.modalOpen = ngModel.$viewValue;
            };
        }
    }
});