angular.module("Homepage").factory("homepageData", ["$q","$http", function($q, $http){
    return {
        getData: function(){
            var deferred = $q.defer();

            deferred.resolve({
                notifications: [
                    {
                        name: "Facebook",
                        id: "facebook",
                        refreshInterval: 15000
                    }
                ],
                widgets: [
                    {
                        modules: [
                            {
                                htmlPath: "partials/google_reader.html",
                                name: "Google Reader",
                                settings: {
                                    display: "full"
                                }
                            }
                        ]
                    },
                    {
                        modules: [
                            {
                                htmlPath: "widgets/instagram/instagram.html",
                                name: "Instagram"
                            },
                        ]
                    },
                    {
                        modules: [
                            {
                                htmlPath: "partials/rss_reader.html",
                                settings: {
                                    feed: "http://www.ynet.co.il/Integration/StoryRss2.xml",
                                    display: "headlines"
                                }
                            },
                            {
                                htmlPath: "partials/rss_reader.html",
                                settings: {
                                    feed: "http://feeds.wired.com/wired/index",
                                    display: "headlines"
                                }
                            },
                            {
                                htmlPath: "partials/rss_reader.html",
                                settings: {
                                    feed: "https://api.twitter.com/1/statuses/user_timeline.rss?screen_name=SeinfeldToday",
                                    display: "headlines"
                                }
                            }
                        ]
                    }
                ]
            });

            return deferred.promise;
        }
    };
}]);