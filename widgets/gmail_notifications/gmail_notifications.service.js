angular.module("Notifications").factory("gmail_notifications", ["oauth", "$q", "$http", "utils", function(oauth, $q, $http, utils){
    var currentUser,
        apiUrl = "https://mail.google.com/mail/feed/atom",
        clientId = "225561981539.apps.googleusercontent.com",
        currentUser;

    function convertEntry(entry){
        var author = entry.getElementsByTagName("author")[0],
            title = entry.getElementsByTagName("title")[0].innerText,
            entryData = {
                id: entry.getElementsByTagName("id")[0].innerText,
                //icon: fbNotification.icon_url,
                unread: false, // Gmail inbox feed returns only unread emails. I want to show them as regular.
                link: entry.getElementsByTagName("link")[0].getAttribute("href"),
                from: { name: author.getElementsByTagName("name")[0].innerText, link: "mailto:" + author.getElementsByTagName("email")[0].innerText },
                //image: getProfileImage(fbNotification.sender_id),
                date: new Date(entry.getElementsByTagName("modified")[0].innerText),
                direction: utils.strings.getDirection(title),
                summary: entry.getElementsByTagName("summary")[0].innerText
            };

        entryData.html = "<strong>" + entryData.from.name + "</strong> &ndash; " + title;
        return entryData;
    }

    var methods = {
        get loggedIn(){
            return true;
        },
        login: function(){
            var deferred = $q.defer();

            deferred.resolve({});

            return deferred.promise;
        },
        logout: function(){
            currentUser = null;
            oauth.logout("gmail_notifications");
        },
        getCurrentUser: function(){
            var deferred = $q.defer();

            if (currentUser){
                deferred.resolve(currentUser);
                return deferred.promise;
            }

            $http.get("https://www.google.com/reader/api/0/user-info?client=" + clientId)
                .success(function(userData){
                    deferred.resolve({
                        id: userData.userId,
                        name: userData.userEmail,
                        //link: me.data.link,
                        image: "http://profiles.google.com/s2/photos/profile/me?sz=32",
                        link: "http://mail.google.com"
                    });
                })
                .error(function(error){
                    deferred.reject(error);
                });

            return deferred.promise;
        },
        getNotifications: function(options){
            var deferred = $q.defer();

            $http.get(apiUrl).then(function(xml){
                var returnData = {items: [], unreadCount: 0 },
                    feed = document.createElement("div"),
                    entries;

                feed.innerHTML = xml.data;
                feed = feed.firstElementChild;

                returnData.unreadCount = parseInt(feed.getElementsByTagName("fullcount")[0].innerText, 10);
                entries = feed.getElementsByTagName("entry");

                angular.forEach(entries, function(entry){
                    returnData.items.push(convertEntry(entry));
                });

                deferred.resolve(returnData);
            }, function(error){
                console.error("can't load atom: ", error);
                deferred.resolve({items: [], unreadCount: 0 });
            });
            /*
            FB.fql(fqlQuery).then(
                function(response){
                    var notifications = { items: [], unreadCount: 0 };
                    angular.forEach(response.data.data, function(fbNotification){
                        var tempDiv = document.createElement("div");
                        tempDiv.innerHTML = fbNotification.title_html;

                        var htmlLinks = tempDiv.querySelectorAll("a[href]");
                        angular.forEach(htmlLinks, function(link){
                            link.setAttribute("target", "_blank");
                        });

                        notifications.items.push({
                            id: fbNotification.notification_id,
                            icon: fbNotification.icon_url,
                            unread: !!fbNotification.is_unread,
                            link: fbNotification.href,
                            html: tempDiv.innerHTML,
                            from: fbNotification.sender_id,
                            image: getProfileImage(fbNotification.sender_id),
                            date: new Date(fbNotification.created_time * 1000)
                        });

                        if (fbNotification.is_unread)
                            notifications.unreadCount++;
                    });

                    deferred.resolve(notifications);
                },
                function(error){
                    deferred.reject(error);
                }
            )
            */
            return deferred.promise;
        },
        markAsRead: function(notificationIds){
            if (!notificationIds || !notificationIds.length)
                return false;

            //FB.method("notifications.markRead", {unread: "0", notification_ids: notificationIds.join(",")});
        }
    };

    return methods;
}]);