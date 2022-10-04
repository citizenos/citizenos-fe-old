import * as angular from 'angular';

angular
    .module('citizenos')
    .factory("AppService", ['$rootScope', '$log', '$state', '$stateParams', '$window', '$location', '$timeout', '$interval', '$cookies', '$anchorScroll', '$translate', 'sTranslate', 'amMoment', 'sLocation', 'cosConfig', 'ngDialog', 'sAuth', 'sUser', 'sHotkeys', 'sNotification', 'sActivity', 'sTopic', 'TopicInviteUser', function ($rootScope, $log, $state, $stateParams, $window, $location, $timeout, $interval, $cookies, $anchorScroll, $translate, sTranslate, amMoment, sLocation, cosConfig, ngDialog, sAuth, sUser, sHotkeys, sNotification, sActivity, sTopic, TopicInviteUser) {
        var self = {
            config: cosConfig,
            showSearch: false,
            showSearchResults: false,
            showNav: false,
            showSearchFiltersMobile: false,
            showTestingEnvNotification: $location.host() === 'test.app.citizenos.com',
            showHelp: false,
            isLoading: true,
            unreadActivitiesCount: 0,
            currentUrlAbs: $location.absUrl(),
            tabSelect: null,
            user: sAuth.user,
            topic: null,
            group: null,
            notifications: sNotification,
            helptooltip: false,
            isShowActivityModal: false,
            language: null,
            tabSelected: null,
            dialog: null,
            metainfo: {
                title: null,
                description: null,
                keywords: null,
                icon: sLocation.getAbsoluteUrl('/imgs/favicon.ico'),
                iconHires: sLocation.getAbsoluteUrl('/imgs/icon_hires.png'),
                author: null,
                image: sLocation.getAbsoluteUrl('/imgs/logo_dark_seo.jpg'),
                url: null,
                siteName: 'CitizenOS.com',
                hreflang: {}
            },
            languagesArray: [],
            toggleHelp: function () {
                self.showHelp = !self.showHelp;
            },
            toggleHelpTooltip: function () {
                self.helptooltip = true;
            },
            helpBubbleAnimate: function () {
                var bubble = angular.element( document.querySelector( '#help_bubble' ) );
                console.log(bubble);
                bubble.addClass('animate');
                $timeout(function () {
                    bubble.removeClass('animate');
                }, 2000);
            },
            setDefaultMetaInfo: function () {
                angular.extend(self.metainfo, {
                    icon: sLocation.getAbsoluteUrl('/imgs/favicon.ico'),
                    iconHires: sLocation.getAbsoluteUrl('/imgs/icon_hires.png'),
                    author: null,
                    image: sLocation.getAbsoluteUrl('/imgs/logo_dark_seo.jpg'),
                    url: null,
                    siteName: 'CitizenOS.com',
                    hreflang: {}
                });

                $translate('META_DEFAULT_TITLE').then(function (translation) {
                    self.metainfo.title = translation;
                });

                $translate('META_DEFAULT_DESCRIPTION').then(function (translation) {
                    self.metainfo.description = translation;
                });

                $translate('META_DEFAULT_KEYWORDS').then(function (translation) {
                    self.metainfo.keywords = translation;
                });
            },
            createRelUrls: function () {
                angular.forEach(sTranslate.LANGUAGES, function (language) {
                    var url = $location.url().split('/');
                    url[1] = language;
                    self.metainfo.hreflang[language] = sLocation.getBaseUrl() + url.join('/');
                });
            },
            doShowLogin: function () {
                $log.debug('AppCtrl.doShowLogin()');

                return ngDialog
                    .open({
                        template: '<login-form></login-form>',
                        plain: true
                    });
            },
            doShowMyAccount: function () {
                $log.debug('AppCtrl.doShowMyAccount()');

                ngDialog.open({
                    template: '<my-account></my-account>',
                    plain: true
                });
            },
            doShowActivityModal: function () {
                $log.debug('AppCtrl.doShowActivityModal()');
                var openDias = ngDialog.getOpenDialogs();

                if (openDias.length) {
                    ngDialog.closeAll();
                } else {
                    var dialog = ngDialog.open({
                        template: '<activity-feed></activity-feed>',
                        plain: true
                    });

                    self.isShowActivityModal = true;

                    dialog.closePromise
                        .then(function () {
                            self.isShowActivityModal = false;
                        });
                }
            },
            doShowLanguageSelect: function () {
                $log.debug('AppCtrl.doShowLanguageSelect()');

                self.languagesArray = [];
                angular.forEach(self.config.language.list, function (val, key) {
                    self.languagesArray.push({
                        key: key,
                        val: val
                    });
                });

                ngDialog.open({
                    template: '/views/modals/languages.html',
                    scope: self
                });
            },
            doSwitchLanguage: function (language) {
                $log.debug('AppCtrl.doSwitchLanguage()', language);
                if (language === self.language) {
                    return;
                }

                if (self.user.loggedIn && sTranslate.checkLanguageIsValid(language) && self.user.language !== language) {
                    sUser
                        .updateLanguage(language)
                        .then(function () {
                            self.user.language = language;
                            sTranslate.switchLanguage(language);
                        });
                } else {
                    if (sTranslate.checkLanguageIsValid(language)) {
                        $cookies.putObject('language', language);
                        $log.debug('langCookie', $cookies.getObject('language'));
                    }
                    sTranslate.switchLanguage(language);
                }
            },
            doLogout: function () {
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
            },
            selectTab: function (tab) {
                self.tabSelected = tab;
                var params = angular.extend({}, $stateParams);
                params['tab'] = tab;
                $state.transitionTo($state.current.name, params, {location: true, notify: false, reload: false});
            },
            doWidgetLogout: function () {
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
            },
            scrollToAnchor: function (anchor) {
                // TODO: Probably not the most elegant way but works for now. Probably should be a directive, which calculates the yOffset (https://docs.angularjs.org/api/ng/service/$anchorScroll#yOffset)
                console.log(anchor)
                return $timeout(function () {
                    if ($rootScope.wWidth <= 1024) {
                        $anchorScroll.yOffset = 68;
                    } else {
                        $anchorScroll.yOffset = 8;
                    }
                    $anchorScroll(anchor);
                }, 0);
            },
            displayEmpoweredIcon: function () {
                if (!/citizenos\.com/.test($location.absUrl())) {
                    return true;
                }

                return false;
            },
            isTouchDevice: function () {
                return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
            },
            doShowTopicNotificationSettings: function (topicId) {
                if (!sAuth.user.loggedIn) {
                    return;
                }
                var dialog = ngDialog.open({
                    template: '<set-topic-notifications topic-id="'+topicId+'"></set-topic-notifications>',
                    plain: true
                });

            },
            removeTopicNotifications: function (topicId, setting) {
                return new Promise (function (resolve, reject) {
                    return ngDialog
                    .openConfirm({
                        template: '/views/modals/remove_topic_notifications_confirm.html',
                    })
                    .then(function (data) {
                        return sTopic.deleteTopicNotificationSettings(topicId)
                            .then(resolve);
                    }, function () {
                        return reject();
                    });
                });
            }
        };

        if (!$cookies.getObject('helptooltip') && cosConfig.showHelpTooltip) {
            var exp =  new Date();
            exp.setMonth(exp.getMonth()+6)
            $cookies.putObject('helptooltip', true, {
                expires: exp
            });
            self.toggleHelpTooltip();
        }

        sTranslate
            .getCurrentLanguage()
            .then(function (language) {
                self.language = language;
            });
        self.setDefaultMetaInfo();
        self.createRelUrls();

        $rootScope.$watch(
            function () {
                return self.notifications.dialog
            },
            function (newVal, oldVal) {
                if (newVal && newVal !== oldVal) {
                    var dialog = ngDialog.open({
                        template: '/views/modals/notification.html',
                        data: self.notifications.dialog
                    });

                    dialog.closePromise.then(function () {
                        self.notifications.dialog = null;
                    });
                }
            }
        );

        sHotkeys.add('ctrl+alt+shift+t', sTranslate.debugMode);

        if (self.config.features.analytics) {
            var script = document.createElement('script');
            Object.keys(self.config.features.analytics).forEach(function (key) {
                script.setAttribute(key, self.config.features.analytics[key])
            });
            document.head.appendChild(script);
        }

        $rootScope.$on('ngDialog.opened', function () {
            sNotification.removeAll();
        });

        $rootScope.$on('ngDialog.closed', function () {
            sNotification.removeAll();
        });

        $rootScope.$on('$translateChangeEnd', function () {
            $log.debug('AppCtrl.$translateChangeSuccess', sTranslate.currentLanguage);
            self.language = sTranslate.currentLanguage;
            $timeout(function () {
                var locale = self.language;

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

                var metaDataViews = ['topics/view', 'my/topics/topicId'];
                var isView = false;
                metaDataViews.forEach(function (item) {
                    if ($state.current.name.indexOf(item) > -1) {
                        isView = true;
                    }
                });

                if (!isView) {
                    self.setDefaultMetaInfo();
                }

                self.metainfo.url = window.location.origin + window.location.pathname;

                window.prerenderReady = true;

                self.currentUrlAbs = $location.absUrl();

                if ($window.ga) {
                    $window.ga('send', {
                        hitType: 'pageview',
                        page: $location.url()
                    });
                }

                self.showSearch = false;
                self.showSearchResults = false;
                self.showSearchFiltersMobile = false;
                self.showNav = false;
                $anchorScroll();
            });
        });

        $rootScope.displaySearch = function () {
            var allowedState = ['home', 'my/groups', 'my/topics', 'public/groups', 'public/groups/view', 'my/groups/groupId', 'my/topics/topicId'];
            if (allowedState.indexOf($state.current.name) > -1) {
                return true;
            }

            return false;
        };

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            $log.debug('$stateChangeError', 'event', event, 'toState', toState, 'toParams', toParams, 'fromState', fromState, 'fromParams', fromParams, 'error', error);
            var errorCheck = function () {
                if (error && error.status && error.data && error.config) { // $http failure in "resolve"
                    var stateError = 'error/' + error.status;
                    $log.debug('$stateChangeError', '"resolve" failed in route definition.');
                    $state.go(stateError, {language: fromParams.language || self.user.language}, {location: false});
                }
            }
            if (self.user.loggedIn && toState.name.indexOf('topics.view') > -1) {
                return TopicInviteUser
                    .query({
                        topicId: toParams.topicId
                    }).$promise
                    .then(function (invites) {
                        if (invites.length) {
                            return invites[0].$accept()
                                .then(function () {
                                        return $state.go(
                                            'topics/view',
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
        var getUnreadActivities = function () {
            sActivity
                .getUnreadActivities()
                .then(function (count) {
                    self.unreadActivitiesCount = count;
                });
        };

        // Update new activities count
        var newActivitiesWatcher = null;
        var authStatusWatcher = null;
        $rootScope.$watch(
            function () {
                return self.user.loggedIn;
            },
            function (loggedIn) {
                if (loggedIn) {
                    getUnreadActivities();
                    newActivitiesWatcher = $interval(function () {
                        getUnreadActivities();
                    }, 30000);
                    authStatusWatcher = $interval(function () {
                        sAuth.status();
                    }, 10000);
                } else if (newActivitiesWatcher) {
                    $interval.cancel(newActivitiesWatcher);
                    $interval.cancel(authStatusWatcher);
                    newActivitiesWatcher = undefined;
                    authStatusWatcher = undefined;
                    self.unreadActivitiesCount = 0;
                }
            });

        $rootScope.$watch(
            function () {
                return self.user.id;
            },
            function (newId, oldId) {
                if (oldId && newId !== oldId) {
                    $state.go('home');
                    if (newId)
                        return sNotification.addInfo('MSG_INFO_ACCOUNT_SWITCH_PAGE_REDIRECT')
                }
            });

        return self;
      }]);
