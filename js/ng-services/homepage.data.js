angular.module("Homepage").factory("homepageData", ["$q","$http", function($q, $http){
    return {
        getData: function(){
            var deferred = $q.defer();

            deferred.resolve({
                notifications: [
                    {
                        name: "Facebook",
                        id: "facebook",
                        refreshRate: 30
                    },
                    {
                        name: "Gmail",
                        id: "gmail_notifications",
                        refreshRate: 30
                    }
                ],
                widgets: [
                    {
                        modules: [
                            {
                                htmlPath: "widgets/google_reader/google_reader.html",
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
                                htmlPath: "widgets/rss/rss_reader.html",
                                settings: {
                                    feed: "http://www.ynet.co.il/Integration/StoryRss2.xml",
                                    display: "headlines"
                                }
                            },
                            {
                                htmlPath: "widgets/rss/rss_reader.html",
                                settings: {
                                    feed: "http://feeds.wired.com/wired/index",
                                    display: "headlines"
                                }
                            },
                            {
                                htmlPath: "widgets/rss/rss_reader.html",
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