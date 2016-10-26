'use strict';

angular
    .module('citizenos')
    .service('sTranslate', ['$translate', '$log', 'cosConfig', function ($translate, $log,  cosConfig) {
    var Translate = this;

    Translate.LOCALES = Object.keys(cosConfig.language.list);
    Translate.currentLocale = $translate.resolveClientLocale();

    var services = {
        setLanguage: setLanguage,
        currentLocale: getCurrentLocale,
        currentLanguage: getCurrentLanguage,
        checkLocaleIsValid:checkLocaleIsValid
    };

    return services;

    function setLanguage (locale) {
        if(checkLocaleIsValid(locale) && $translate.use() !== locale) {
            $log.debug('setLanguage', locale);
            Translate.currentLocale = locale;
            return $translate.use(locale);
        }
        return $translate.use();
    }

    function getCurrentLanguage() {
        return cosConfig.language.list[Translate.currentLocale];
    }
    function getCurrentLocale() {
        return Translate.currentLocale;
    }

    function checkLocaleIsValid(locale) {
        return Translate.LOCALES.indexOf(locale) !== -1;
    }

}]);
