import * as angular from 'angular';
import * as $ from 'jquery';

export class AppService {
    private editMode = false;
    private partner;
    private showSearch = false;
    private showSearchResults = false;
    private showNav = false;
    private showSearchFiltersMobile = false;
    private showTestingEnvNotification;
    private showHelp = false;
    private isLoading = true;
    private unreadActivitiesCount = 0;
    private currentUrlAbs;
    private tabSelect;
    private user;
    private topic;
    private topicsSettings = false;
    private group;
    private notifications;
    private helptooltip;
    private isShowActivityModal = false;
    private language;
    private tabSelected;
    private dialog;
    private metainfo = {
        title: '',
        description: '',
        keywords: '',
        icon: '',
        iconHires: '',
        author: '',
        image: '',
        url: '',
        siteName: 'CitizenOS.com',
        hreflang: {}
    };
    private languagesArray : object[] = [];

    constructor (private $rootScope, private $log, private $state, private $stateParams, private $transitions, private $window, private $location, private $timeout, private $interval, private $cookies, private $anchorScroll, private $translate, private sTranslate, private amMoment, private sLocation, private config, private ngDialog, private sAuth, private sUser, private sHotkeys, private sNotification, private sActivity, private TopicNotification, private TopicInviteUser, private Topic) {
        this.showTestingEnvNotification =  ($location.host() === 'test.app.citizenos.com');
        this.currentUrlAbs = $location.absUrl();
        this.user = sAuth.user;
        this.notifications = sNotification;

        if (!$cookies.getObject('helptooltip') && config.showHelpTooltip) {
            var exp =  new Date();
            exp.setMonth(exp.getMonth()+6)
            $cookies.putObject('helptooltip', true, {
                expires: exp
            });
            this.toggleHelpTooltip();
        }

        sTranslate
            .getCurrentLanguage()
            .then((language) => {
                this.language = language;
            });
        this.setDefaultMetaInfo();
        this.createRelUrls();
        this.transitionSuccessHandler();
        this.transitionErrorHandler();
        this.checkNewActivities();
        this.notificationDialogWatcher();
        this.translateChangeEndWatcher();
        this.accountSwitchWatcher();

        sHotkeys.add('ctrl+alt+shift+t', sTranslate.debugMode);

        if (this.config.features.analytics) {
            var script = document.createElement('script');
            Object.keys(this.config.features.analytics).forEach((key) => {
                script.setAttribute(key, this.config.features.analytics[key])
            });
            document.head.appendChild(script);
        }

        $rootScope.$on('ngDialog.opened', function () {
            sNotification.removeAll();
        });

        $rootScope.$on('ngDialog.closed', function () {
            sNotification.removeAll();
        });

        $rootScope.displaySearch = () => {
            const allowedState = ['home', 'my/groups', 'my/topics', 'public/groups', 'public/groups/view', 'my/groups/groupId', 'my/groups/groupId/settings', 'my/topics/topicId', 'my/topics/topicId/settings'];

            if (allowedState.indexOf($state.current.name) > -1) {
                return true;
            }

            return false;
        };
    }

    toggleHelp () {
        this.showHelp = !this.showHelp;
    };

    toggleHelpTooltip () {
        this.helptooltip = true;
    };

    helpBubbleAnimate () {
        const bubble = angular.element( document.querySelector( '#help_bubble' ) );
        bubble.addClass('animate');
        this.$timeout(() => {
            bubble.removeClass('animate');
        }, 2000);
    };

    setDefaultMetaInfo () {
        angular.extend(this.metainfo, {
            icon: this.sLocation.getAbsoluteUrl('/imgs/favicon.ico'),
            iconHires: this.sLocation.getAbsoluteUrl('/imgs/icon_hires.png'),
            author: null,
            image: this.sLocation.getAbsoluteUrl('/imgs/logo_dark_seo.jpg'),
            url: null,
            siteName: 'CitizenOS.com',
            hreflang: {}
        });

        this.$translate('META_DEFAULT_TITLE').then((translation) => {
            this.metainfo.title = translation;
        });

        this.$translate('META_DEFAULT_DESCRIPTION').then((translation) => {
            this.metainfo.description = translation;
        });

        this.$translate('META_DEFAULT_KEYWORDS').then((translation) => {
            this.metainfo.keywords = translation;
        });
    };

    createRelUrls () {
        angular.forEach(this.sTranslate.LANGUAGES, (language) => {
            const url = this.$location.url().split('/');
            url[1] = language;
            this.metainfo.hreflang[language] = this.sLocation.getBaseUrl() + url.join('/');
        });
    };

    doShowLogin () {
        this.$log.debug('AppCtrl.doShowLogin()');
        console.log('LOGIN')
        const dialog = this.ngDialog
            .open({
                template: '<login-form></login-form>',
                plain: true
            });
    };

    doShowMyAccount () {
        this.$log.debug('AppService.doShowMyAccount()');

        this.ngDialog.open({
            template: '<my-account></my-account>',
            plain: true
        });
    };

    doShowActivityModal () {
        this.$log.debug('AppService.doShowActivityModal()');
        const openDias = this.ngDialog.getOpenDialogs();

        if (openDias.length) {
            this.ngDialog.closeAll();
        } else {
            const dialog = this.ngDialog.open({
                template: '<activity-feed></activity-feed>',
                plain: true
            });

            this.isShowActivityModal = true;

            dialog.closePromise
                .then(() => {
                    this.isShowActivityModal = false;
                });
        }
    };

    doShowLanguageSelect () {
        this.$log.debug('AppService.doShowLanguageSelect()');
        this.languagesArray = [];
        angular.forEach(this.config.language.list, (val, key) => {
            this.languagesArray.push({
                key: key,
                val: val
            });
        });

        this.ngDialog.open({
            template: '/views/modals/languages.html'
        });
    };

    doSwitchLanguage (language) {
        this.$log.debug('AppService.doSwitchLanguage()', language);
        if (language === this.language) {
            return;
        }

        if (this.user.loggedIn && this.sTranslate.checkLanguageIsValid(language) && this.user.language !== language) {
            this.sUser
                .updateLanguage(language)
                .then(() => {
                    this.user.language = language;
                    this.sTranslate.switchLanguage(language);
                });
        } else {
            if (this.sTranslate.checkLanguageIsValid(language)) {
                this.$cookies.putObject('language', language);
                this.$log.debug('langCookie', this.$cookies.getObject('language'));
            }
            this.sTranslate.switchLanguage(language);
        }
    };

    doLogout () {
        this.sAuth
            .logout()
            .then(() => {
                this.$state.go('home');
                this.ngDialog.closeAll();
                this.sNotification.removeAll();
            },(err) => {
                this.$log.error('AppService.doLogout()', 'Logout failed', err);
                this.sNotification.addError('MSG_ERROR_LOGOUT_FAILED');
            });
    };

    selectTab (tab) {
        this.tabSelected = tab;
        var params = angular.extend({}, this.$stateParams);
        params['tab'] = tab;
        var reload = false;
       /* if (this.$state.current.name === 'group/create') {
            reload=false;
        }*/
        this.$state.transitionTo(this.$state.current.name, params, {location: true, notify: false, reload: reload});
    };

    doWidgetLogout () {
        this.sAuth
            .logout()
            .then(() => {
                this.$state.reload();
                this.sNotification.removeAll();
            }, (err) => {
                this.$log.error('AppService.doLogout()', 'Logout failed', err);
                this.sNotification.addError('MSG_ERROR_LOGOUT_FAILED');
            });
    };

    scrollToAnchor (anchor) {
        // TODO: Probably not the most elegant way but works for now. Probably should be a directive, which calculates the yOffset (https://docs.angularjs.org/api/ng/service/$anchorScroll#yOffset)
        return this.$timeout(() => {
            if (this.$rootScope.wWidth <= 1024) {
                this.$anchorScroll.yOffset = 68;
            } else {
                this.$anchorScroll.yOffset = 8;
            }
            this.$anchorScroll(anchor);
        }, 0);
    };

    displayEmpoweredIcon () {
        if (!/citizenos\.com/.test(this.$location.absUrl())) {
            return true;
        }

        return false;
    };

    isTouchDevice () {
        return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    };

    doShowTopicNotificationSettings (topicId) {
        const state = this.$state.$current.name;
        if (!this.sAuth.user.loggedIn) {
            return;
        }
        const dialog = this.ngDialog.open({
            template: '<set-topic-notifications topic-id="'+topicId+'"></set-topic-notifications>',
            plain: true
        });

        dialog.closePromise.then((data) => {
            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                this.$timeout(() => {
                    this.$state.go('^');
                });
            }
        });

    };

    removeTopicNotifications (topicId, setting) {
        return new Promise ((resolve, reject) => {
            return this.ngDialog
            .openConfirm({
                template: '/views/modals/remove_topic_notifications_confirm.html',
            })
            .then((data) => {
                return this.TopicNotification
                    .delete({topicId})
                    .then(resolve);
            }, () => {
                return reject();
            });
        });
    };

    doToggleEditMode () {
        this.editMode = !this.editMode;
        this.topicsSettings = false;
        if (this.editMode === true) {
            this.$state.go(
                'topics/view',
                {
                    topicId: this.topic.id,
                    editMode: this.editMode,
                    commentId: null
                }
            );
        } else {
            this.$state.go(
                'topics/view',
                {
                    topicId: this.topic.id,
                    editMode: null,
                    commentId: null
                },
                {
                    reload: true
                }
            );

            this.$timeout(() => {
                this.Topic
                    .get(this.topic.id)
                    .then((topic) => {
                        this.topic = topic;
                    });
            }, 1000);
        }
    };

    closeThisDialog (e) {
        const dialog = $(e.target).closest('.ngdialog');
        this.ngDialog.close(dialog.attr('id'), '$closeButton');
    };

    transitionSuccessHandler () {
        this.$transitions.onSuccess({}, () => {
            this.$timeout(() => {
                this.$log.debug('AppService.$stateChangeSuccess', 'prerenderReady', this.$state.$current.name);

                const metaDataViews = ['topics/view', 'my/topics/topicId'];
                let isView = false;
                metaDataViews.forEach((item) => {
                    if (this.$state.current.name.indexOf(item) > -1) {
                        isView = true;
                    }
                });

                if (!isView) {
                    this.setDefaultMetaInfo();
                }

                this.metainfo.url = window.location.origin + window.location.pathname;

                window.prerenderReady = true;

                this.currentUrlAbs = this.$location.absUrl();

                if (this.$window.ga) {
                    this.$window.ga('send', {
                        hitType: 'pageview',
                        page: this.$location.url()
                    });
                }

                this.showSearch = false;
                this.showSearchResults = false;
                this.showSearchFiltersMobile = false;
                this.showNav = false;
                this.$anchorScroll();
            });
        });
    };

    transitionErrorHandler () {
        this.$transitions.onError({}, (transition) => {
            const error = transition.error();
            const params = transition.params();
            const toState = transition.to();
            const errorCheck = () => {
                if (error && error.detail?.status && error.detail?.data && error.detail?.config) { // $http failure in "resolve"
                    const stateError = 'error/' + error.detail.status;
                    this.$state.go(stateError, {language: params.language || this.user.language}, {location: false});
                }
            }
            if (this.user.loggedIn && toState.name.indexOf('topics/view') > -1) {
                return this.TopicInviteUser
                    .query({
                        topicId: params.topicId
                    })
                    .then((invites) => {
                        if (invites.length) {
                            return this.TopicInviteUser.accept(invites[0])
                                .then(() => {
                                    return this.$state.go(
                                        'topics/view',
                                        params
                                    )
                                });
                        } else {
                            errorCheck();
                        }
                    }, errorCheck);
            }
            errorCheck();
        });
    };

    checkNewActivities () {
        // Update new activities count
        let newActivitiesWatcher = null;
        let authStatusWatcher = null;

        const getUnreadActivities = () => {
            this.sActivity
                .getUnreadActivities()
                .then((count) => {
                    this.unreadActivitiesCount = count;
                });
        };
        this.$rootScope.$watch(() => {
            return this.user.loggedIn;
        }, (loggedIn) => {
            if (loggedIn) {
                getUnreadActivities();
                newActivitiesWatcher = this.$interval(() => {
                    getUnreadActivities();
                }, 30000);
                authStatusWatcher = this.$interval(() => {
                    this.sAuth.status();
                }, 10000);
            } else if (newActivitiesWatcher) {
                this.$interval.cancel(newActivitiesWatcher);
                this.$interval.cancel(authStatusWatcher);
                newActivitiesWatcher = undefined;
                authStatusWatcher = undefined;
                this.unreadActivitiesCount = 0;
            }
        });
    }

    notificationDialogWatcher () {
        this.$rootScope.$watch(()=> {
            return this.notifications.dialog
        }, (newVal, oldVal) => {
            if (newVal && newVal !== oldVal) {
                const dialog = this.ngDialog.open({
                    template: '/views/modals/notification.html',
                    data: this.notifications.dialog
                });

                dialog.closePromise.then(() => {
                    this.notifications.dialog = null;
                });
            }
        });
    }

    translateChangeEndWatcher () {
        this.$rootScope.$on('$translateChangeEnd', () => {
            this.$log.debug('AppService.$translateChangeSuccess', this.sTranslate.currentLanguage);
            this.language = this.sTranslate.currentLanguage;
            this.$timeout(() => {
                let locale = this.language;

                // Every "en" is defaulted to "en-GB" for date formatting BUT more precise locale determination below -  https://github.com/citizenos/citizenos-fe/issues/154
                if (locale === 'en') {
                    locale = 'en-GB';
                }

                // Go through User Agents list of languages, see if more precise locale is found in the list and use that for Moment - https://github.com/citizenos/citizenos-fe/issues/154
                if (this.$window.navigator.languages) {
                    const preciseLocales = this.$window.navigator.languages.filter((val) => { // IE compatible "Array.prototype.find". We can dump this when we drop support for IE.
                        return val.indexOf(locale + '-') > -1; //search for a more specific locale.. that is, if it is "en", we try to find "en-US, en-GB" etc.
                    });
                    if (preciseLocales && preciseLocales[0]) {
                        locale = preciseLocales[0];
                    }
                }
                this.amMoment.changeLocale(locale);
            }, 0);
        });
    }

    accountSwitchWatcher () {
        this.$rootScope.$watch(() => {
            return this.user.id;
        }, (newId, oldId) => {
            if (oldId && newId !== oldId) {
                this.$state.go('home');
                if (newId)
                    return this.sNotification.addInfo('MSG_INFO_ACCOUNT_SWITCH_PAGE_REDIRECT')
            }
        });
    }
};

angular
    .module('citizenos')
    .service("AppService", ['$rootScope', '$log', '$state', '$stateParams', '$transitions', '$window', '$location', '$timeout', '$interval', '$cookies', '$anchorScroll', '$translate', 'sTranslate', 'amMoment', 'sLocation', 'cosConfig', 'ngDialog', 'sAuth', 'sUser', 'sHotkeys', 'sNotification', 'sActivity', 'TopicNotification', 'TopicInviteUser', 'Topic', AppService]);
