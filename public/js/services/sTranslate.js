'use strict';

angular
    .module('citizenos')
    .service('sTranslate', ['$state', '$translate', '$log', 'cosConfig', function ($state, $translate, $log,  cosConfig) {
        var sTranslate = this;

        sTranslate.LOCALES = Object.keys(cosConfig.language.list);
        sTranslate.currentLocale = cosConfig.language.default;

        var clientLang = $translate.resolveClientLocale();
        if (sTranslate.LOCALES.indexOf(clientLang) > -1) {
            sTranslate.currentLocale = clientLang;
        }

        sTranslate.setLanguage = function (locale) {
            if(checkLocaleIsValid(locale) && $translate.use() !== locale) {
                $log.debug('setLanguage', locale);
                sTranslate.currentLocale = locale;
                return $translate.use(locale);
            }
            return $translate.use();
        };

        sTranslate.switchLanguage = function (locale) {
            $log.debug('switch language', locale);
            if(checkLocaleIsValid(locale)){
                $state.transitionTo($state.current.name, {language:locale});
            }

            sTranslate.setLanguage(locale);
        };
        sTranslate.getCurrentLanguage = function() {
            return cosConfig.language.list[sTranslate.currentLocale];
        };

        sTranslate.getCurrentLocale = function () {
            return sTranslate.currentLocale;
        };

        var checkLocaleIsValid = function (locale) {
            return sTranslate.LOCALES.indexOf(locale) !== -1;
        };

    }]);
