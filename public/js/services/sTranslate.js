'use strict';

angular
    .module('citizenos')
    .service('sTranslate', ['$state', '$stateParams', '$translate', '$log', '$filter', '$cookies', 'cosConfig', function ($state, $stateParams, $translate, $log, $filter, $cookies, cosConfig) {
        var sTranslate = this;

        sTranslate.LANGUAGES = Object.keys(cosConfig.language.list);
        sTranslate.currentLanguage = cosConfig.language.default;
        var debugLang = cosConfig.language.debug;

        var init = function () {
            var clientLang = $translate.resolveClientLocale();
            if ($cookies.get('language')) {
                clientLang = $cookies.get('language');
            }
            if (sTranslate.LANGUAGES.indexOf(clientLang) > -1) {
                sTranslate.currentLanguage = clientLang;
            }
        };
        init();

        sTranslate.setLanguage = function (language) {
            $translate.onReady(function () {
                if (sTranslate.checkLanguageIsValid(language) && $translate.use() !== language) {
                    $log.debug('setLanguage', language);
                    sTranslate.currentLanguage = language;
                    return $translate.use(language);
                }
                return $translate.use();
            });
        };

        sTranslate.switchLanguage = function (language) {
            $translate.onReady(function () {
                $log.debug('switch language', language);
                if (sTranslate.checkLanguageIsValid(language)) {
                    $stateParams.language = language;
                    if (language === 'aa') { // Crowdin language selected, we need a full page reload for the in-context script to work.
                        window.location.href = $state.href($state.current.name, $stateParams);
                    } else {
                        $state.transitionTo($state.current.name, $stateParams);
                    }
                }
                sTranslate.setLanguage(language);
            });
        };

        sTranslate.debugMode = function () {
            $translate.onReady(function () {
                if ($translate.use() === debugLang) {
                    $translate.use(sTranslate.currentLanguage);
                } else {
                    $translate.use(debugLang);
                }
            });
        };

        sTranslate.checkLanguageIsValid = function (language) {
            if (language === debugLang) {
                return false;
            }
            return sTranslate.LANGUAGES.indexOf(language) !== -1;
        };

    }]);
