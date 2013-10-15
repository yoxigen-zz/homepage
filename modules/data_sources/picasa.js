angular.module("Homepage").factory("picasa", ["GoogleOAuth2", "$q", "$http", "Cache", "utils", "parse", function(GoogleOAuth2, $q, $http, Cache, utils, parse){

    var clientId = "225561981539-vrlluijrg9h9gvq6ghbnnv59rcerkrh8.apps.googleusercontent.com",
        cache = new Cache({
            id: "picasa",
            hold: true,
            itemsExpireIn: 60 * 30 // cache items expire in 30 minutes
        }),
        picasaOauth = new GoogleOAuth2({
            apiName: "picasa",
            scope: "https://picasaweb.google.com/data/ https://www.googleapis.com/auth/userinfo.profile"
        }),
        apiUrl = "https://picasaweb.google.com/data/feed/api/",
        picasaCropSizes = [32, 48, 64, 72, 104, 144, 150, 160],
        picasaUncropSizes = [94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600].concat(picasaCropSizes).sort(function(a,b){ return a-b; }),
        picasaDefaults = {
            v: 2,
            setThumbnail: true,
            setSingleAlbumThumbnails: true,
            setTitle: true, // Whether to add a header with user and/or album name before thumbnails
            alt: 'json',
            cropThumbnails: false,
            "max-results": 25,
            thumbsize: 64,
            imgmax: picasaUncropSizes[picasaUncropSizes.length - 1],
            fields: "category(@term),entry(category(@term)),title,entry(summary),entry(media:group(media:thumbnail)),entry(media:group(media:content(@url))),entry(media:group(media:content(@width))),entry(media:group(media:content(@height))),entry(link[@rel='alternate'](@href)),entry(media:group(media:credit)),openSearch:totalResults,entry(gphoto:height),entry(gphoto:width),entry(author)"
        };

    var feeds = {
        publicFeeds: [
            { name: "Featured Photos", id: "featured", url: "https://picasaweb.google.com/data/feed/api/featured", isPublic: true }
        ],
        privateFeeds: [
            { name: "My Albums", id: "userAlbums", hasChildren: true, user: "default", childrenType: "albums", cache: true, cacheTime: 6 * 3600, type: "albums" }
        ]},
        albumsFeed = { name: "My Albums", id: "userAlbums", hasChildren: true, user: "default", childrenType: "albums", cache: true, cacheTime: 6 * 3600, type: "albums" };

    function getDataFromUrl(source, options){
        var data = $.extend({}, picasaDefaults, options),
            urlMatch;

        if (source.link){
            if (source.link.indexOf(apiUrl) === 0){
                var query = source.link.split("?");
                if (query.length > 1){
                    var fields = query[1].split("&");
                    for(var i = 0, field; i < fields.length; i++){
                        field = fields[i].split("=");
                        data[field[0]] = field[1] || true;
                    }
                }

                data.url = query[0];
            }
            else{
                urlMatch = source.url.match(picasaMatchRegex);
                delete data.url;
            }
        }
        else if (Object(source) === source)
            angular.extend(data, source);

        if (urlMatch && urlMatch.length > 1)
        {
            var urlData = {
                user: urlMatch[1],
                album: urlMatch[2],
                query: urlMatch[3]
            };

            data.user = urlData.user;

            if (urlData.album)
                data.album = urlData.album;

            if (urlData.query)
                angular.extend(data, utils.url.queryToJson(urlData.query));
        }

        if (data.album){
            data.fields += ",entry(summary),gphoto:name,entry(gphoto:timestamp),entry(gphoto:commentCount),entry(gphoto$commentingEnabled),entry(author)";
        }
        else
            data.fields += ",entry(title),entry(gphoto:numphotos),entry(gphoto:name),entry(link[@rel='alternate']),author,entry(summary),entry(id),entry(gphoto:timestamp)";

        data.imgmax = getImgMax(picasaUncropSizes, data.imgmax);
        data.thumbsize = getImgMax(data.cropThumbnails ? picasaCropSizes : picasaUncropSizes, data.thumbsize) + (data.cropThumbnails ? "c" : "u");

        data.access_token = picasaOauth.oauthData.token;

        return data;
    }

    function getImgMax(picasaSizes, optionsImgmax){
        var imgMax = Math.min(optionsImgmax, Math.max(screen.width, screen.height));

        for(var i=picasaSizes.length, picasaSize; (i-- -1) && (picasaSize = picasaSizes[i]) && picasaSizes[i - 1] >= imgMax;){}
        return picasaSize;
    }

    function getFeedUrl(picasaData)
    {
        var feedUrl = apiUrl;
        if (picasaData.user && picasaData.user != "lh")
        {
            feedUrl += "user/" + picasaData.user;
            if (picasaData.album)
                feedUrl += "/album/" + picasaData.album;
        }
        else
            feedUrl += "all";

        return feedUrl;
    }

    var convert = {
        album: function(picasaData, authorData){
            var thumbnail = picasaData.media$group.media$thumbnail[0];
            return {
                name: picasaData.title.$t,
                id: picasaData.gphoto$id.$t,
                link: picasaData.link[0].href,
                imageCount: picasaData.gphoto$numphotos.$t,
                thumbnail: {
                    src: thumbnail.url,
                    width: thumbnail.width,
                    height: thumbnail.height
                },
                type: "album"
            }
        },
        albums: function(picasaData, authorData){
            var albums = [];

            angular.forEach(picasaData, function(albumData){
                albums.push(convert.album(albumData, authorData));
            });

            return albums;
        },
        photo: function(picasaData){

        },
        photos: function(picasaData){

        }
    };

    function getImagesData(picasaData, source, authorData)
    {
        var itemsData = [];

        angular.forEach(picasaData.feed.entry, function(image){
            var isAlbum = image.category[0].term.match(/#(.*)$/)[1] === "album";
            if (isAlbum && !image.gphoto$numphotos.$t)
                return true;

            var author = image.author && image.author[0] || authorData;
            var imageTitle = isAlbum ? image.title.$t : image.summary.$t,
                mediaData = image.media$group.media$content[0],
                thumbnailData = image.media$group.media$thumbnail[0],
                itemData = {
                    thumbnail: {
                        src: thumbnailData.url,
                        width: thumbnailData.width,
                        height: thumbnailData.height
                    },
                    src: mediaData.url,
                    link: image.link[0].href,
                    title: imageTitle,
                    type: "image",
                    time: new Date(parseInt(image.gphoto$timestamp.$t, 10)),
                    social: {
                        commentsCount: image.gphoto$commentCount && image.gphoto$commentCount.$t
                    }
                };

            if (author){
                itemData.author = {
                    name: author.name.$t,
                    link: author.uri.$t,
                    image: author.gphoto$thumbnail.$t
                };
            }
            /*
            try{
                if (!authorData && image.author){
                    var author = image.author[0];
                    itemData.author = {
                        id: author.gphoto$user.$t,
                        name: author.name.$t,
                        link: author.uri.$t,
                        avatar: "http://profiles.google.com/s2/photos/profile/" + author.gphoto$user.$t
                    };
                }
            } catch(e){ console.log("ERROR: ", image, e)}
              */
            if (source.cropThumbnails){
                angular.extend(itemData.thumbnail, {
                    width: source.thumbsize,
                    height: source.thumbsize,
                    ratio: 1
                });
            }
            else if (!isAlbum){
                angular.extend(itemData.thumbnail, {
                    width: thumbnailData.width,
                    height: thumbnailData.height,
                    ratio: thumbnailData.height / thumbnailData.width
                });
            }

            if (itemData.width){
                itemData.width = parseInt(image.gphoto$width, 10);
                itemData.height = parseInt(image.gphoto$height, 10);
                itemData.ratio = itemData.height / itemData.width;
            }

            if (isAlbum){
                itemData.data = {
                    album: {
                        id: image.gphoto$name.$t,
                        name: imageTitle,
                        imageCount: image.gphoto$numphotos.$t,
                        description: image.summary.$t,
                        url: image.link[0].href
                    }};
                itemData.isLoaded = true;
            }
            else{
                angular.extend(itemData, {
                    width: mediaData.width,
                    height: mediaData.height,
                    ratio: mediaData.height / mediaData.width
                });
            }

            itemsData.push(itemData);
        });

        return itemsData;
    }
    
    function loadData(source){
        var returnData = {
            source: source,
            createThumbnails: true
        };

        var deferred = $q.defer();
        /*
        if (source.cache){
            var cachedData = cache().getItem(source.id);
            if (cachedData){
                returnData.items = cachedData.items;
                returnData.totalItems = cachedData.totalItems;
                deferred.resolve(cachedData);
                return deferred.promise;
            }
        }
          */

        if (picasaOauth.oauthData)
            getData();
        else
            picasaOauth.getOauth().then(function(oauthData){
                getData();
            }, deferred.reject);

        function getData(){
            var picasaData = getDataFromUrl(source, source);
            delete picasaData.fields;

            $http.jsonp(picasaData.url || getFeedUrl(picasaData), {
                params: angular.extend( { callback: "JSON_CALLBACK" }, picasaData)
            }).then(function(result){
                    var data = result.data;
                    returnData.totalItems = data.feed.openSearch$totalResults.$t;

                    if (!data.feed.entry || data.feed.entry.length == 0){
                        returnData.items = [];
                    }
                    else{
                        var kind = data.feed.category ? data.feed.category[0].term.match(/#(.*)$/)[1] : "photo",
                            author = data.feed.author && data.feed.author[0],
                            authorData;
                        if (author){
                            authorData = {
                                id: author.uri.$t.match(/\d+/)[0],
                                name: author.name.$t,
                                link: author.uri.$t
                            };

                            authorData.avatar = "http://profiles.google.com/s2/photos/profile/" + authorData.id;
                        }

                        if (kind === "user"){
                            var author = data.feed.author[0];
                            angular.extend(returnData, {
                                title: data.feed.title.$t,
                                data: {
                                    kind: "user",
                                    author: authorData
                                }
                            });
                        }
                        returnData.createThumbnails = true;
                        returnData.items = source.id === "userAlbums" ? convert.albums(data.feed.entry, authorData) : getImagesData(data, source, authorData);
                        /*
                        if (source.cache)
                            cache().setItem(source.id, { items: returnData.items, totalItems: returnData.totalItems }, { expiresIn: source.cacheTime }); // Albums are cached for 6 hours
                            */
                    }

                    deferred.resolve(returnData);
                },
                function(error){
                    deferred.reject(error);
                }
            );
        }
        return deferred.promise;
    }

    var methods = {
        name: "Picasa",
        id: "picasa",
        auth: {
            isLoggedIn: function(){
                return picasaOauth.isLoggedIn();
            },
            login: function(){
                var deferred = $q.defer();

                methods.auth.isLoggedIn().then(function(isLoggedIn){
                    if (isLoggedIn)
                        deferred.resolve(picasaOauth.authData);
                    else{
                        picasaOauth.login().then(function(){
                            deferred.resolve(picasaOauth.authData);
                        }, function(error){
                            deferred.reject(error);
                        });
                    }
                });

                return deferred.promise;
            },
            logout: function(){
                picasaOauth.logout();
                picasaOauth.destroy();
            },
            getCurrentUser: picasaOauth.getCurrentUser
        },
        images: {
            getAlbums: function(){
                return methods.images.load(albumsFeed);
            },
            getFeeds: function(){
                return feeds;
            },
            load: function(source){
                var deferred = $q.defer();
                loadData(source).then(function(data){
                    deferred.resolve(data);
                });

                return deferred.promise;
            }
        }
    };

    return methods;
}]);
