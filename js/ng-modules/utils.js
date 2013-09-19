angular.module("Utils", []).factory("utils", ["$q", function($q){
    var methods = {
        arrays: {
            /**
             * http://stackoverflow.com/questions/962802/is-it-correct-to-use-javascript-array-sort-method-for-shuffling
             * @param array
             * @returns {*}
             */
            shuffle: function(array){
                var tmp, current, top = array.length;

                if(top) while(--top) {
                    current = Math.floor(Math.random() * (top + 1));
                    tmp = array[current];
                    array[current] = array[top];
                    array[top] = tmp;
                }

                return array;
            }
        },
        images: {
            /**
             * From http://stackoverflow.com/questions/5573096/detecting-webp-support
             */
            webpSupported: function(){
                var deferred = $q.defer();

                if (methods.images.webpSupported.isSupported !== undefined)
                    deferred.resolve(methods.images.webpSupported.isSupported);
                else{
                    // some small (2x1 px) test images for each feature
                    var image = "data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==";

                    var imgElement  = document.createElement("img");
                    imgElement.addEventListener("load", function(){
                        if(this.width === 2 && this.height === 1) {
                            deferred.resolve(true);
                            methods.images.webpSupported.isSupported = true;
                        } else {
                            methods.images.webpSupported.isSupported = false;
                            deferred.resolve(false);
                        }
                    });

                    imgElement.addEventListener("error", function() {
                        methods.images.webpSupported.isSupported = false;
                        deferred.resolve(false);
                    });

                    imgElement.src = image;
                }

                return deferred.promise;
            }
        },
        strings: {
            getDirection: function(str){
                return this.isRtl(str) ? "rtl" : "ltr"
            },
            getRandomString: function(length, chars){
                if (!length || Number(length) !== length)
                    throw new Error("Invalid length for utils.strings.getRandomString: ", length, ".");

                var availableChars = chars || "abcdefghijklmnopqrstuvwxyz0123456789",
                    str = [];

                for( var i=0; i < length; i++)
                    str.push(availableChars.charAt(Math.floor(Math.random() * availableChars.length)));

                return str.join("");
            },
            isRtl: function(str){
                return /[\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC]/.test(str);
            },
            /**
             * Recognizes URLs in a string and creates <A> elements around them.
             * @param str
             * @param target
             */
            makeLinks: function(str, target){

            },
            /**
             * Removes HTML tags from the string.
             * @param str
             * @return {*}
             */
            stripHtml: function(str){
                var temp = document.createElement("div"),
                    strippedStr = str.replace(/src=(["'])/, "nosrc=$1");

                temp.innerHTML = strippedStr;
                return temp.innerText.replace(/\"/g, "&quot;");
            },
            /**
             * Shortens the string to the specified length, then trims the end, so words aren't cut in the middle.
             * @param str
             * @param length
             */
            trim: function(str, length, suffix){
                if (str.length <= length)
                    return str;

                return str.slice(0, length).replace(/[\s\.:,!\?\(\)]+[^\s\.:,!\?\(\)]*$/, suffix || "")

            }
        },
        url: {
            getDomain: function(url){
                var match = url.match(/^(https?:\/\/[^\/]+)/);
                return match ? match[1] : null;
            },
            queryToJson: function(query){
                if (!query)
                    return null;

                var queryParams = query.split("&"),
                    json = {};

                for(var i=queryParams.length; i--;)
                {
                    var paramData = queryParams[i].split('=');
                    json[paramData[0]] = paramData.length == 2 ? paramData[1] : true;
                }
                return json;
            }
        }
    }

    return methods;
}]);