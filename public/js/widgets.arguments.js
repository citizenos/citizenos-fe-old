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
         *
         * @constructor
         */
        window.CITIZENOS.widgets.Argument = function (language, topicId, partnerId, targetId) {
            document.addEventListener('DOMContentLoaded', function () {
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

                if (targetElementId) {
                    path += '?widgetId=' + encodeURIComponent(targetElementId);
                }

                widgetFrame.src = window.CITIZENOS.config.url.fe  + path;

                targetElement.appendChild(widgetFrame);
            });

            var receiveMessage = function (event) {
                console.log('Receive message', event.data);

                if (event.data && event.data.citizenos) {
                    var argumentsData = event.data.citizenos['widgets.arguments'];
                    if (argumentsData) {
                        var widgetId = Object.keys(argumentsData)[0];
                        var widgetFrameId = widgetId + '-frame';
                        var widgetFrame = document.getElementById(widgetFrameId);
                        if (widgetFrame) {
                            widgetFrame.style.visibility = 'visible';
                            widgetFrame.style.width = '100%';
                            widgetFrame.style.height = argumentsData[widgetId].height;
                        } else {
                            console.warn('Widget frame not found!', widgetFrameId);
                        }
                    }
                }
            };
            window.addEventListener('message', receiveMessage, false);
        }
    }
})();
