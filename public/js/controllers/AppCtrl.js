'use strict';

angular
    .module('citizenos')
    .controller('AppCtrl', ['$scope', '$rootScope', '$log', '$state', '$window', '$location', '$timeout', '$interval', '$cookies', '$anchorScroll', 'sTranslate', 'amMoment', 'sLocation', 'cosConfig', 'ngDialog', 'sAuth', 'sUser', 'sHotkeys', 'sNotification', 'sActivity', function ($scope, $rootScope, $log, $state, $window, $location, $timeout, $interval, $cookies, $anchorScroll, sTranslate, amMoment, sLocation, cosConfig, ngDialog, sAuth, sUser, sHotkeys, sNotification, sActivity) {
        $log.debug('AppCtrl');

        $scope.app = {
            config: cosConfig,
            showSearch: false,
            showSearchResults: false,
            showNav: false,
            showSearchFiltersMobile: false,
            isLoading: true,
            unreadActivitiesCount: 0
        };

        $scope.app.user = sAuth.user;

        sTranslate
            .getCurrentLanguage()
            .then(function (language) {
                $scope.app.language = language;
            });

        $scope.app.metainfo = {
            title: 'META_DEFAULT_TITLE',
            description: 'META_DEFAULT_DESCRIPTION',
            keywords: 'META_DEFAULT_KEYWORDS',
            icon: sLocation.getAbsoluteUrl('/imgs/favicon.ico'),
            iconHires: sLocation.getAbsoluteUrl('/imgs/icon_hires.png'),
            author: null,
            image: sLocation.getAbsoluteUrl('/imgs/logo_dark_seo.jpg'),
            url: null,
            siteName: 'CitizenOS.com',
            hreflang: {}
        };

        createRelUrls();

        // Different global notifications that can be shown in the page header OR as a dialog
        $scope.app.notifications = sNotification;
        $scope.$watch(
            function () {
                return $scope.app.notifications.dialog
            },
            function (newVal, oldVal) {
                if(newVal && newVal !== oldVal) {
                    var dialog = ngDialog.open({
                        template: '/views/modals/notification.html',
                        data: $scope.app.notifications.dialog
                    });

                    dialog.closePromise.then(function () {
                        $scope.app.notifications.dialog = null;
                    });
                }
            }
        );

        sHotkeys.add('ctrl+alt+shift+t', sTranslate.debugMode);

        $scope.app.doShowLogin = function () {
            $log.debug('AppCtrl.doShowLogin()');

            return ngDialog
                .open({
                    template: '/views/modals/login.html',
                    scope: $scope
                });
        };

        $scope.app.doShowMyAccount = function () {
            $log.debug('AppCtrl.doShowMyAccount()');

            ngDialog.open({
                template: '/views/modals/my_account.html',
                scope: $scope
            });
        };

        $scope.app.doShowActivityModal = function () {
            $log.debug('AppCtrl.doShowActivityModal()');
            var openDias = ngDialog.getOpenDialogs();

            if (openDias.length) {
                ngDialog.closeAll();
            } else {
                var dialog = ngDialog.open({
                    template: '/views/modals/activity_modal.html',
                    scope: $scope
                });

                $scope.app.isShowActivityModal = true;

                dialog.closePromise
                    .then(function () {
                        $scope.app.isShowActivityModal = false;
                    });
            }
        };

        $scope.app.doShowTopicSettings = function () {
            $log.debug('AppCtrl.doShowTopicSettings()');

            ngDialog.open({
                template: '/views/modals/topic_settings.html',
                scope: $scope
            });
        };

        $scope.app.doShowLanguageSelect = function () {
            $log.debug('AppCtrl.doShowLanguageSelect()');

            $scope.app.languagesArray = [];
            angular.forEach($scope.app.config.language.list, function (val, key) {
                $scope.app.languagesArray.push({
                    key: key,
                    val: val
                });
            });

            ngDialog.open({
                template: '/views/modals/languages.html',
                scope: $scope
            });
        };

        $scope.app.doSwitchLanguage = function (language) {
            $log.debug('AppCtrl.doSwitchLanguage()', language);
            if (language === $scope.app.language) {
                return;
            }

            if ($scope.app.user.loggedIn && sTranslate.checkLanguageIsValid(language) && $scope.app.user.language !== language) {
                sUser
                    .updateLanguage(language)
                    .then(function () {
                        $scope.app.user.language = language;
                        sTranslate.switchLanguage(language);
                    });
            } else {
                if (sTranslate.checkLanguageIsValid(language)) {
                    $cookies.put('language', language);
                    $log.debug('langCookie', $cookies.get('language'));
                }
                sTranslate.switchLanguage(language);
            }
        };

        $scope.app.doLogout = function () {
            sAuth
                .logout()
                .then(
                    function () {
                        $state.go('home');
                    },
                    function (err) {
                        $log.error('AppCtrl.doLogout()', 'Logout failed', err);
                    }
                );
        };

        $scope.app.doWidgetLogout = function () {
            sAuth
                .logout()
                .then(
                    function () {
                        $state.reload();
                    },
                    function (err) {
                        $log.error('AppCtrl.doLogout()', 'Logout failed', err);
                    }
                );
        };

        $scope.app.scrollToAnchor = function (anchor) {
            // TODO: Probably not the most elegant way but works for now. Probably should be a directive, which calculates the yOffset (https://docs.angularjs.org/api/ng/service/$anchorScroll#yOffset)
            $timeout(function () {
                if ($rootScope.wWidth <= 1024) {
                    $anchorScroll.yOffset = 68;
                } else {
                    $anchorScroll.yOffset = 8;
                }
                $anchorScroll(anchor);
            }, 0);
        };

        $scope.app.displayEmpoweredIcon = function () {
            if (!/citizenos\.com/.test($location.absUrl())) {
                return true;
            }

            return false;
        };

        $scope.app.closeFooterNotification = function () {
            var expires = new Date();
            expires.setDate(expires.getDate() + 365);
            $cookies.put('COOKIE_NOTIFICATION', true, {expires: expires});
        };

        $scope.app.displayFooterNotification = function () {
            var show = $cookies.get('COOKIE_NOTIFICATION');

            if (!show) {
                return true;
            }

            return false;
        };

        $rootScope.$on('ngDialog.opened', function () {
            sNotification.removeAll();
        });

        $rootScope.$on('ngDialog.closed', function () {
            sNotification.removeAll();
        });

        $rootScope.$on('$translateChangeEnd', function () {
            $log.debug('AppCtrl.$translateChangeSuccess', sTranslate.currentLanguage);
            $scope.app.language = sTranslate.currentLanguage;
            $timeout(function () {
                amMoment.changeLocale($scope.app.language);
            }, 0);
        });

        $rootScope.$on('$stateChangeSuccess', function () {
            $timeout(function () {
                $log.debug('AppCtrl.$stateChangeSuccess', 'prerenderReady', $state.$current.name);
                window.prerenderReady = true;

                if ($window.ga) {
                    $window.ga('send', {
                        hitType: 'pageview',
                        page: $location.url()
                    });
                }

                $scope.app.showSearch = false;
                $scope.app.showSearchResults = false;
                $scope.app.showSearchFiltersMobile = false;
                $scope.app.showNav = false;
                $anchorScroll();
            });
        });

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            $log.debug('$stateChangeError', 'event', event, 'toState', toState, 'toParams', toParams, 'fromState', fromState, 'fromParams', fromParams, 'error', error);
            if (error.status && error.data && error.config) { // $http failure in "resolve"
                var stateError = 'error.' + error.status;
                $log.debug('$stateChangeError', '"resolve" failed in route definition.');
                $state.go(stateError, {language: fromParams.language || $scope.app.user.language}, {location: false});
            }
        });

        function createRelUrls () {
            angular.forEach(sTranslate.LANGUAGES, function (language) {
                var url = $location.url().split('/');
                url[1] = language;
                $scope.app.metainfo.hreflang[language] = sLocation.getBaseUrl() + url.join('/');
            });
        }

        // Update new activities count
        var newActivitiesWatcher = null;
        $scope.$watch(
            function () {
                return $scope.app.user.loggedIn;
            },
            function (loggedIn) {
                if (loggedIn) {
                    newActivitiesWatcher = $interval(function () {
                        sActivity
                            .getUnreadActivities()
                            .then(function (count) {
                                $scope.app.unreadActivitiesCount = count;
                            });

                    }, 30000);
                } else if (newActivitiesWatcher) {
                    $interval.cancel(newActivitiesWatcher);
                    newActivitiesWatcher = undefined;
                    $scope.app.unreadActivitiesCount = 0;
                }
            });

    }]);
