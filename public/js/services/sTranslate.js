'use strict';

angular
    .module('citizenos')
    .service('sTranslate', ['$state', '$translate', '$log', 'cosConfig', function ($state, $translate, $log,  cosConfig) {
        var sTranslate = this;

        sTranslate.LOCALES = Object.keys(cosConfig.language.list);
        sTranslate.currentLocale = cosConfig.language.default;
        sTranslate.currentLanguage = cosConfig.language.list[sTranslate.currentLocale];

        init();

        sTranslate.setLanguage = function (locale) {
            if(checkLocaleIsValid(locale) && $translate.use() !== locale) {
                $log.debug('setLanguage', locale);
                sTranslate.currentLocale = locale;
                setCurrentLanguage();
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

        sTranslate.getCurrentLocale = function () {
            return sTranslate.currentLocale;
        };

        function setCurrentLanguage () {
             sTranslate.currentLanguage = cosConfig.language.list[sTranslate.currentLocale];
        };

        function checkLocaleIsValid (locale) {
            return sTranslate.LOCALES.indexOf(locale) !== -1;
        };

        function init () {
            var clientLang = $translate.resolveClientLocale();
            if (sTranslate.LOCALES.indexOf(clientLang) > -1) {
                sTranslate.currentLocale = clientLang;
                setCurrentLanguage();
            }
        }
    }]);
