'use strict';

/**
 * Angular User Voice
 *
 * Created by m on 11.06.15.
 */
(function (window, angular) {
    var app = angular.module('cosUserVoice', []);

    app.provider('UserVoice', function () {
        var apiKey = null;

        this.setApiKey = function (key) {
            apiKey = key;
        };

        this.$get = ['$window', '$document', function ($window, $document) {
            if (!apiKey) throw new Error('UserVoice requires JavaScript API key to be set. Set it in .config using setApiKey.');

            $window.UserVoice = $window.UserVoice || [];
            (function () {
                var document = $document[0];
                var uv = document.createElement('script');
                uv.type = 'text/javascript';
                uv.async = true;
                uv.src = '//widget.uservoice.com/:apiKey.js'.replace(':apiKey', apiKey);
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(uv, s)
            })();

            // To avoid calling the incorrect instance of UserVoice, we use apply
            // to explicitly pass the correct UserVoice instance and the given
            // arguments on method call
            // Borrowed from - https://github.com/chesleybrown/uservoice-trigger-directive/blob/master/service.uservoice.js
            return {
                push: function () {
                    $window.UserVoice.push.apply($window.UserVoice, arguments);
                }
            }
        }];
    });
})(window, angular);
