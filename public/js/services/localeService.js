/**
 * @ngdoc function
 * @name app.factory:LocaleService
 * @description
 * # LocaleService
 * Service for setting/getting current locale
 */
app.service('LocaleService', function ($state, $translate, $log,  cosConfig, $rootScope) {
    'use strict';
    // VARS
    var localesObj = cosConfig.language.list;

    // locales and locales display names
    var _LOCALES = Object.keys(localesObj);
    if (!_LOCALES || _LOCALES.length === 0) {
      $log.error('There are no _LOCALES provided');
    }
    var _LOCALES_DISPLAY_NAMES = [];
    _LOCALES.forEach(function (locale) {
      _LOCALES_DISPLAY_NAMES.push(localesObj[locale]);
    });

    var currentLocale = $translate.proposedLanguage();// because of async loading

    // METHODS
    var checkLocaleIsValid = function (locale) {
      return _LOCALES.indexOf(locale) !== -1;
    };

    var setLocale = function (locale) {
      if (!checkLocaleIsValid(locale)) {
        $log.error('Locale name "' + locale + '" is invalid');
        return;
      }
      startLoadingAnimation();
      currentLocale = locale;
      $state.transitionTo($state.current.name, {language:locale});
      $translate.use(locale);
    };

    /**
     * Stop application loading animation when translations are loaded
     */
    var $html = angular.element('html');
    var LOADING_CLASS = 'app-loading';

    function startLoadingAnimation() {
      $html.addClass(LOADING_CLASS);
    }

    function stopLoadingAnimation() {
      $html.removeClass(LOADING_CLASS);
    }

    // EVENTS
    $rootScope.$on('$translateChangeSuccess', function (event, data) {
      document.documentElement.setAttribute('lang', data.language);// sets "lang" attribute to html

    });

    $rootScope.$on('$localeChangeSuccess', function () {
      stopLoadingAnimation();
    });

    return {
      getLocaleDisplayName: function () {
        $log.debug('getLocaleDisplayName', currentLocale, localesObj[currentLocale])
        return localesObj[currentLocale];
      },
      setLocaleByDisplayName: function (localeDisplayName) {
        setLocale(
          _LOCALES[
            _LOCALES_DISPLAY_NAMES.indexOf(localeDisplayName)// get locale index
            ]
        );
      },
      getLocalesDisplayNames: function () {
        return _LOCALES_DISPLAY_NAMES;
      }
    };
  });
