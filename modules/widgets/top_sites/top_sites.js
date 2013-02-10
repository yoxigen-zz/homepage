angular.module("TopSites").factory("topSites", ["$q", "$rootScope", function($q, $rootScope){
    return {
        getTopSites: function(maxItems){
            var deferred = $q.defer();

            chrome.topSites.get(function(data){
                if (maxItems)
                    data = data.slice(0, maxItems);

                deferred.resolve(data);
                $rootScope.safeApply();
            });

            return deferred.promise;
        }
    }
}]);