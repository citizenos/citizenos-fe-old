'use strict';

import * as angular from 'angular';

angular
    .module('citizenos')
    .service('sTranslate', ['$state', '$stateParams', '$translate', '$log', '$q', 'cosConfig', function ($state, $stateParams, $translate, $log, $q, cosConfig) {
        var sTranslate = this;

        sTranslate.LANGUAGES = Object.keys(cosConfig.language.list);
        sTranslate.currentLanguage = cosConfig.language.default;
        var debugLang = cosConfig.language.debug;

        sTranslate.setLanguage = function (language) {
            $log.debug('sTranslate.setLanguage', language);
            return $q(function (resolve, reject) {
                $translate.onReady(function () {
                    $log.debug('sTranslate.setLanguage', 'onReady', language, $translate.use(), $translate.use() !== language);
                    if (sTranslate.checkLanguageIsValid(language) && $translate.use() !== language) {
                        sTranslate.currentLanguage = language;
                        return resolve($translate.use(language));
                    }
                    return resolve($translate.use());
                });
            });
        };

        sTranslate.switchLanguage = function (language) {
            $translate.onReady(function () {
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
                if ($translate.use() !== debugLang) {
                    $translate.use(debugLang);
                } else {
                    $translate.use(sTranslate.currentLanguage);
                }
            });
        };

        sTranslate.checkLanguageIsValid = function (language) {
            if (language === debugLang) {
                return false;
            }
            return sTranslate.LANGUAGES.indexOf(language) !== -1;
        };

        sTranslate.getCurrentLanguage = function () {
            return $q(function (resolve, reject) {
                $translate.onReady(function () {
                    return resolve($translate.use());
                });
            });
        }

    }]);
