angular.module("Slideshow").directive("slideshow", function(){
    return {
        restrict: "A",
        require: '?ngModel',
        link: function($scope, element, attrs, ngModel){
            if(!ngModel) return; // do nothing if no ng-model

            var imageUrls,
                intervalId,
                interval = attrs.slideshowInterval ? parseInt(attrs.slideshowInterval, 10) * 1000 : 15000,
                currentImage;

            function changeImage(url){
                element.css("backgroundImage", "url(" + url + ")");
            }

            function advanceSlideshow(){
                currentImage = currentImage === undefined ? 0 : currentImage + 1;
                if (currentImage >= imageUrls.length)
                    currentImage = 0;

                changeImage(imageUrls[currentImage]);
            }

            // Specify how UI should be updated
            ngModel.$render = function() {
                element.css({
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center center",
                    backgroundSize: "cover"
                });

                imageUrls = ngModel.$viewValue || [];

                advanceSlideshow();

                if (attrs.slideInBackground){
                    var changeOnLeaveTab = true;

                    chrome.tabs.getCurrent(function(currentTab){
                        chrome.tabs.onActivated.addListener(function(activeInfo){
                            if (changeOnLeaveTab && activeInfo.tabId !== currentTab.id){
                                setTimeout(advanceSlideshow, 2000);
                                changeOnLeaveTab = false;
                            }
                            else
                                changeOnLeaveTab = true;
                        });
                    });
                }
                else if(imageUrls.length > 1){
                    intervalId = setInterval(advanceSlideshow, interval);
                }
            };
        }
    };
});