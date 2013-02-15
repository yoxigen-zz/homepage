angular.module("Homepage").directive("modal", function(){
    return {
        restrict: "E",
        template: ['<div class="modal" ng-show="modalOpen" ng-cloak>',
                  '<div class="modal-background"></div>',
                  '<div class="modal-contents" ng-click="closeModal($event)" ng-transclude>',
                  '</div></div>'].join(""),
        transclude: true,
        replace: true,
        require: '?ngModel',
        link: function($scope, element, attrs, ngModel){
            $scope.closeModal = function(event){
                if (event.target.classList.contains("modal-contents")){
                    $scope.modalOpen = false;
                    ngModel.$setViewValue(false);
                }
            };

            ngModel.$render = function() {
                $scope.modalOpen = ngModel.$viewValue;
            };
        }
    }
});