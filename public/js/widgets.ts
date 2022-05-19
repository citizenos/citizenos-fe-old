(function () {
    window.CITIZENOS = window.CITIZENOS || {widgets: {}};

    var scripts = document.getElementsByTagName('script');
    var src = scripts[scripts.length - 1].src;
    var scriptOrigin = src.match(/https?:\/\/[^/]*/)[0];

    window.CITIZENOS.config = {
        url: {
            fe: scriptOrigin
        }
    };


    if (!window.CITIZENOS.widgets.Argument) {
        /**
         * Argument
         *
         * @param {string} language 2 letter language code (ISO 639-1 Code)
         * @param {string} topicId CitizenOS Topic ID OR Partner entity ID IF "partnerId" is provided.
         * @param {string|null} [partnerId=undefined] Partner id for the Topic. If used, the "topicId" is considered to be Partner entity id and will be internally mapped to CitizenOS Topic id
         * @param {string} [targetId=undefined] Containing pages target element id
         * @param {object} [options=undefined] Containing custom title, style properties
         *
         * @constructor
         */
        window.CITIZENOS.widgets.Argument = function (language, topicId, partnerId, targetId, options) {
            if(!options) {
                options = {};
            }
            var targetElementId = targetId || 'citizenos-widget-argument-' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 5);

            var targetElement = document.getElementById(targetElementId);

            if (!targetElement) {
                targetElement = document.createElement('div');
                targetElement.id = targetElementId;
                document.getElementsByTagName('body')[0].appendChild(targetElement);
            }

            var widgetFrame = document.createElement('iframe');
            widgetFrame.id = targetElementId + '-frame';
            widgetFrame.setAttribute('scrolling', 'no');
            widgetFrame.style.height = '1px';
            widgetFrame.style.width = '1px';
            widgetFrame.style.visibility = 'hidden';

            var path;
            if (partnerId) {
                path = '/:language/widgets/partners/:partnerId/topics/:sourcePartnerObjectId/arguments'
                    .replace(':language', encodeURIComponent(language))
                    .replace(':partnerId', encodeURIComponent(partnerId))
                    .replace(':sourcePartnerObjectId', encodeURIComponent(topicId));
            } else {
                path = '/:language/widgets/topics/:topicId/arguments'
                    .replace(':language', encodeURIComponent(language))
                    .replace(':topicId', encodeURIComponent(topicId));
            }
            var queryParams = [];
            var queryString = '';
            if (targetElementId) {
                queryParams.push('widgetId=' + encodeURIComponent(targetElementId));
            }

            var queryOptions = Object.keys(options);
            for(var i=0; i < queryOptions.length; i++) {
                var key = queryOptions[i];
                queryParams.push(key + '=' + encodeURIComponent(options[key]));
            }

            queryString = queryParams.join('&');

            if (queryString.length) {
                path += '?' + queryString;
            }

            widgetFrame.src = window.CITIZENOS.config.url.fe + path;

            targetElement.appendChild(widgetFrame);

            return targetElement;
        };
    }

    /**
     * Activity Feed
     *
     * @param {string} language 2 letter language code (ISO 639-1 Code)
     * @param {string|null} [topicId=undefined] CitizenOS Topic ID OR Partner entity ID IF "partnerId" is provided. If not provided, all events of Topics for that "partnerId" are fetched.
     * @param {string|null} [partnerId=undefined] Partner id for the Topic. If used, the "topicId" is considered to be Partner entity id and will be internally mapped to CitizenOS Topic id
     * @param {string} [targetId=undefined] Containing pages target element id
     * @param {object} [options=undefined] Containing custom title, style, filter properties
     *
     * @constructor
     */
    if (!window.CITIZENOS.widgets.ActivityFeed) {
        window.CITIZENOS.widgets.ActivityFeed = function (language, topicId, partnerId, targetId, options) {
            var targetElementId = targetId || 'citizenos-widget-argument-' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 5);

            var targetElement = document.getElementById(targetElementId);

            if (!targetElement) {
                targetElement = document.createElement('div');
                targetElement.id = targetElementId;
                document.getElementsByTagName('body')[0].appendChild(targetElement);
            }

            var widgetFrame = document.createElement('iframe');
            widgetFrame.id = targetElementId + '-frame';
            widgetFrame.style.height = '1px';
            widgetFrame.style.width = '1px';
            widgetFrame.style.visibility = 'hidden';

            var path;
            if (partnerId && topicId) {
                path = '/:language/widgets/partners/:partnerId/topics/:sourcePartnerObjectId/activities'
                    .replace(':language', encodeURIComponent(language))
                    .replace(':partnerId', encodeURIComponent(partnerId))
                    .replace(':sourcePartnerObjectId', encodeURIComponent(topicId));
            } else if (partnerId) {
                path = '/:language/widgets/partners/:partnerId/activities'
                    .replace(':language', encodeURIComponent(language))
                    .replace(':partnerId', encodeURIComponent(partnerId));
            } else if (topicId) {
                path = '/:language/widgets/topics/:topicId/activities'
                    .replace(':language', encodeURIComponent(language))
                    .replace(':topicId', encodeURIComponent(topicId));
            } else {
                path = '/:language/widgets/activities'
                    .replace(':language', encodeURIComponent(language));
            }

            var queryParams = [];
            var queryString = '';
            if (targetElementId) {
                queryParams.push('widgetId=' + encodeURIComponent(targetElementId));
            }

            var queryOptions = Object.keys(options);
            for(var i=0; i < queryOptions.length; i++) {
                var key = queryOptions[i];
                queryParams.push(key + '=' + encodeURIComponent(options[key]));
            }

            queryString = queryParams.join('&');

            if (queryString.length) {
                path += '?' + queryString;
            }

            widgetFrame.src = window.CITIZENOS.config.url.fe + path;

            targetElement.appendChild(widgetFrame);

            return targetElement;
        }
    }

    var receiveMessage = function (event) {
        console.log('Receive message', event.data);

        if (event.data && event.data.citizenos) {
            var argumentsData = event.data.citizenos['widgets'];
            if (argumentsData) {
                var widgetId = Object.keys(argumentsData)[0];
                var widgetElement = document.getElementById(widgetId);

                var widgetFrameId = widgetId + '-frame';
                var widgetFrame = document.getElementById(widgetFrameId);

                var widgetFrameHeight = widgetElement.getAttribute('data-height') || 'auto';

                if (widgetFrame) {
                    // height change message
                    if (argumentsData[widgetId].height) {
                        widgetFrame.style.visibility = 'visible';
                        widgetFrame.style.width = '100%';
                        if (widgetFrameHeight === 'auto') {
                            widgetFrame.style.height = argumentsData[widgetId].height + 'px';
                        } else {
                            widgetFrame.style.height = widgetFrameHeight;
                        }
                    }

                    // overlay is shown in frame
                    if (argumentsData[widgetId].overlay) {
                        document.documentElement.scrollTop = argumentsData[widgetId].overlay.top + widgetFrame.getBoundingClientRect().top + window.scrollY;
                    }

                    // click event
                    if (argumentsData[widgetId].click) {
                        var event = new CustomEvent('citizenos.widget.click', {
                            detail: argumentsData[widgetId].click
                        });
                        widgetElement.dispatchEvent(event);
                    }
                }
            }
        }
    };
    window.addEventListener('message', receiveMessage, false);
})();
