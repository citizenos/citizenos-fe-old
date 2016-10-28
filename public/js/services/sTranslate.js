'use strict';

angular
    .module('citizenos')
    .service('sTranslate', ['$state', '$translate', '$log', 'cosConfig', function ($state, $translate, $log, cosConfig) {
        var sTranslate = this;

        var LANGUAGES = Object.keys(cosConfig.language.list);
        sTranslate.currentLanguage = cosConfig.language.default;

        function init () {
            var clientLang = $translate.resolveClientLocale();
            if (LANGUAGES.indexOf(clientLang) > -1) {
                sTranslate.currentLanguage = clientLang;
            }
        }

        init();

        sTranslate.setLanguage = function (language) {
            if(checkLanguageIsValid(language) && $translate.use() !== language) {
                $log.debug('setLanguage', language);
                sTranslate.currentLanguage = language;
                return $translate.use(language);
            }
            return $translate.use();
        };

        sTranslate.switchLanguage = function (language) {
            $log.debug('switch language', language);
            if(checkLanguageIsValid(language)){
                $state.transitionTo($state.current.name, {language:language});
            }
            sTranslate.setLanguage(language);
        };

        function checkLanguageIsValid (language) {
            return LANGUAGES.indexOf(language) !== -1;
        }

    }]);
