angular
    .module('citizenos')
    .run(['$q', '$log', '$http', '$templateCache', function ($q, $log, $http, $templateCache) {
        var templates = [
            '/views/about.html',
            '/views/faq.html',
            '/views/groups.html',
            '/views/help.html',
            '/views/home.html',
            '/views/no_topics.html',
            '/views/topic.html',
            '/views/topic.voting.html',
            '/views/topics.html',
            '/views/default/nav.html',
            '/views/default/nav_mobile.html',
            '/views/default/search.html',
            '/views/layouts/main.html',
            '/views/modals/login.html',
            '/views/modals/sign_up.html',
        ];
        var index = 0;
        if (pages.length) {
            downloadToCache();
        }

        function downloadToCache() {
            var template = templates[index];
            $http({
                method: 'GET',
                url: pages[index]
            })
                .then(function (response) {
                    $log.debug('Template ' + response.config.url + ' cached');
                    $templateCache.put(response.config.url, response.data);

                    if (++index < pages.length) {
                        downloadToCache();
                    }
                }, function (err) {
                    $log.debug("Template error", err);
                    if (++index < pages.length) {
                        downloadToCache();
                    }
                });
        }

    }]);
