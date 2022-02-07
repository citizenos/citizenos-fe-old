'use strict';

angular
    .module('citizenos')
    .controller('AppCtrl', ['$scope', '$rootScope', '$log', '$state', '$window', '$location', '$timeout', '$interval', '$cookies', '$anchorScroll', '$translate', 'sTranslate', 'amMoment', 'sLocation', 'cosConfig', 'ngDialog', 'sAuth', 'sUser', 'sHotkeys', 'sNotification', 'sActivity', 'sTopic', 'TopicInviteUser', function ($scope, $rootScope, $log, $state, $window, $location, $timeout, $interval, $cookies, $anchorScroll, $translate, sTranslate, amMoment, sLocation, cosConfig, ngDialog, sAuth, sUser, sHotkeys, sNotification, sActivity, sTopic, TopicInviteUser) {
        $log.debug('AppCtrl', $location.host());

        $scope.app = {
            config: cosConfig,
            showSearch: false,
            showSearchResults: false,
            showNav: false,
            showSearchFiltersMobile: false,
            showTestingEnvNotification: $location.host() === 'test.app.citizenos.com',
            showHelp: false,
            isLoading: true,
            unreadActivitiesCount: 0,
            currentUrlAbs: $location.absUrl()
        };

        $scope.app.user = sAuth.user;

        $scope.app.toggleHelp = function () {
            $scope.app.showHelp = !$scope.app.showHelp;
        };

        $scope.app.toggleHelpTooltip = function () {
            $scope.app.helptooltip = true;
        }
        if (!$cookies.get('helptooltip') && cosConfig.showHelpTooltip) {
            var exp =  new Date();
            exp.setMonth(exp.getMonth()+6)
            $cookies.put('helptooltip', true, {
                expires: exp
            });
            $scope.app.toggleHelpTooltip();
        }


        $scope.app.helpBubbleAnimate = function () {
            var bubble = angular.element( document.querySelector( '#help_bubble' ) );
            console.log(bubble);
            bubble.addClass('animate');
            $timeout(function () {
                bubble.removeClass('animate');
            }, 2000);
        }

        sTranslate
            .getCurrentLanguage()
            .then(function (language) {
                $scope.app.language = language;
            });

        var setDefaultMetaInfo = function () {
            $scope.app.metainfo = {
                icon: sLocation.getAbsoluteUrl('/imgs/favicon.ico'),
                iconHires: sLocation.getAbsoluteUrl('/imgs/icon_hires.png'),
                author: null,
                image: sLocation.getAbsoluteUrl('/imgs/logo_dark_seo.jpg'),
                url: null,
                siteName: 'CitizenOS.com',
                hreflang: {}
            };

            $translate('META_DEFAULT_TITLE').then(function (translation) {
                $scope.app.metainfo.title = translation;
            });

            $translate('META_DEFAULT_DESCRIPTION').then(function (translation) {
                $scope.app.metainfo.description = translation;
            });

            $translate('META_DEFAULT_KEYWORDS').then(function (translation) {
                $scope.app.metainfo.keywords = translation;
            });
        };
        setDefaultMetaInfo();
        createRelUrls();

        // Different global notifications that can be shown in the page header OR as a dialog
        $scope.app.notifications = sNotification;
        $scope.$watch(
            function () {
                return $scope.app.notifications.dialog
            },
            function (newVal, oldVal) {
                if (newVal && newVal !== oldVal) {
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

        // Insert Analytics - https://github.com/citizenos/citizenos-fe/issues/457
        if ($scope.app.config.features.analytics) {
            var script = document.createElement('script');
            Object.keys($scope.app.config.features.analytics).forEach(function (key) {
                script.setAttribute(key, $scope.app.config.features.analytics[key])
            });
            document.head.appendChild(script);
        }

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
                        ngDialog.closeAll();
                        sNotification.removeAll();
                    },
                    function (err) {
                        $log.error('AppCtrl.doLogout()', 'Logout failed', err);
                        sNotification.addError('MSG_ERROR_LOGOUT_FAILED');
                    }
                );
        };

        $scope.app.doWidgetLogout = function () {
            sAuth
                .logout()
                .then(
                    function () {
                        $state.reload();
                        sNotification.removeAll();
                    },
                    function (err) {
                        $log.error('AppCtrl.doLogout()', 'Logout failed', err);
                        sNotification.addError('MSG_ERROR_LOGOUT_FAILED');
                    }
                );
        };

        $scope.app.scrollToAnchor = function (anchor) {
            // TODO: Probably not the most elegant way but works for now. Probably should be a directive, which calculates the yOffset (https://docs.angularjs.org/api/ng/service/$anchorScroll#yOffset)
            return $timeout(function () {
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
                var locale = $scope.app.language;

                // Every "en" is defaulted to "en-GB" for date formatting BUT more precise locale determination below -  https://github.com/citizenos/citizenos-fe/issues/154
                if (locale === 'en') {
                    locale = 'en-GB';
                }

                // Go through User Agents list of languages, see if more precise locale is found in the list and use that for Moment - https://github.com/citizenos/citizenos-fe/issues/154
                if ($window.navigator.languages) {
                    var preciseLocales = $window.navigator.languages.filter(function (val) { // IE compatible "Array.prototype.find". We can dump this when we drop support for IE.
                        return val.indexOf(locale + '-') > -1; //search for a more specific locale.. that is, if it is "en", we try to find "en-US, en-GB" etc.
                    });
                    if (preciseLocales && preciseLocales[0]) {
                        locale = preciseLocales[0];
                    }
                }

                amMoment.changeLocale(locale);
            }, 0);
        });

        $rootScope.$on('$stateChangeSuccess', function () {
            $timeout(function () {
                $log.debug('AppCtrl.$stateChangeSuccess', 'prerenderReady', $state.$current.name);

                var metaDataViews = ['topics.view', 'my.topics.topicId'];
                var isView = false;
                metaDataViews.forEach(function (item) {
                    if ($state.current.name.indexOf(item) > -1) {
                        isView = true;
                    }
                });

                if (!isView) {
                    setDefaultMetaInfo();
                }

                $scope.app.metainfo.url = window.location.origin + window.location.pathname;

                window.prerenderReady = true;

                $scope.app.currentUrlAbs = $location.absUrl();

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

        $rootScope.displaySearch = function () {
            var allowedState = ['home', 'my.groups', 'my.topics', 'my.groups.groupId', 'my.topics.topicId'];
            if (allowedState.indexOf($state.current.name) > -1) {
                return true;
            }

            return false;
        };

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            $log.debug('$stateChangeError', 'event', event, 'toState', toState, 'toParams', toParams, 'fromState', fromState, 'fromParams', fromParams, 'error', error);
            var errorCheck = function () {
                if (error && error.status && error.data && error.config) { // $http failure in "resolve"
                    var stateError = 'error.' + error.status;
                    $log.debug('$stateChangeError', '"resolve" failed in route definition.');
                    $state.go(stateError, {language: fromParams.language || $scope.app.user.language}, {location: false});
                }
            }
            if ($scope.app.user.loggedIn && toState.name.indexOf('topics.view') > -1) {
                return TopicInviteUser
                    .query({
                        topicId: toParams.topicId
                    }).$promise
                    .then(function (invites) {
                        if (invites.length) {
                            return invites[0].$accept()
                                .then(function () {
                                        return $state.go(
                                            'topics.view',
                                            toParams
                                        )
                                    }
                                );
                        } else {
                            errorCheck();
                        }
                    }, errorCheck);
            }

            errorCheck();
        });

        function createRelUrls () {
            angular.forEach(sTranslate.LANGUAGES, function (language) {
                var url = $location.url().split('/');
                url[1] = language;
                $scope.app.metainfo.hreflang[language] = sLocation.getBaseUrl() + url.join('/');
            });
        }

        var getUnreadActivities = function () {
            sActivity
                .getUnreadActivities()
                .then(function (count) {
                    $scope.app.unreadActivitiesCount = count;
                });
        };

        // Update new activities count
        var newActivitiesWatcher = null;
        $scope.$watch(
            function () {
                return $scope.app.user.loggedIn;
            },
            function (loggedIn) {
                if (loggedIn) {
                    getUnreadActivities();
                    newActivitiesWatcher = $interval(function () {
                        getUnreadActivities();
                    }, 30000);
                } else if (newActivitiesWatcher) {
                    $interval.cancel(newActivitiesWatcher);
                    newActivitiesWatcher = undefined;
                    $scope.app.unreadActivitiesCount = 0;
                }
            });
    }]);
