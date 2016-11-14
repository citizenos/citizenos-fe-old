'use strict';

angular
    .module('citizenos')
    .service('sTranslate', ['$state', '$translate', '$log', '$filter', '$cookies', 'cosConfig', function ($state, $translate, $log, $filter, $cookies, cosConfig) {
        var sTranslate = this;

        var GENERAL_ERROR_KEY_PATTERN = 'MSG_ERROR_:statusCode_:model';
        var GENERAL_ERROR_FALLBACK_KEY_PATTERN = 'MSG_ERROR_:statusCode';
        var FIELD_ERROR_KEY_PATTERN = 'MSG_ERROR_:statusCode_:model_:fieldName';

        // List of models supported by sTranslate. Making it strict so errors would pop up.
        // Model name here should have 1:1 correspondence with a model in the REST API.
        sTranslate.models = {
            USER: 'USER',
            LOGIN: 'LOGIN'
        };

        sTranslate.LANGUAGES = Object.keys(cosConfig.language.list);
        sTranslate.currentLanguage = cosConfig.language.default;
        var debugLang = cosConfig.language.debug;

        var init = function () {
            var clientLang = $translate.resolveClientLocale();
            if($cookies.get('language')){
                clientLang = $cookies.get('language');
            }
            if (sTranslate.LANGUAGES.indexOf(clientLang) > -1) {
                sTranslate.currentLanguage = clientLang;
            }
        };
        init();

        sTranslate.setLanguage = function (language) {
            console.log(language);
            if (sTranslate.checkLanguageIsValid(language) && $translate.use() !== language) {
                $log.debug('setLanguage', language);
                sTranslate.currentLanguage = language;
                return $translate.use(language);
            }
            return $translate.use();
        };

        sTranslate.switchLanguage = function (language) {
            $log.debug('switch language', language);
            if (sTranslate.checkLanguageIsValid(language)) {
                $state.transitionTo($state.current.name, {language: language});
            }
            sTranslate.setLanguage(language);
        };

        sTranslate.debugMode = function () {
            if ($translate.use() !== debugLang) {
                $translate.use(debugLang);
            } else {
                $translate.use(sTranslate.currentLanguage);
            }
        };

        sTranslate.checkLanguageIsValid = function (language) {
            if( language === debugLang ){
                return false;
            }
            return sTranslate.LANGUAGES.indexOf(language) !== -1;
        };

        /**
         * Translate a key. Compared to $translate, it will uppercase any key before translating.
         *
         * @param {string} key Translation key
         * @param {Object} [interpolateParams] Interpolate params
         *
         * @returns {string}
         *
         * @see {@link https://angular-translate.github.io/docs/#/api/pascalprecht.translate.filter:translate}
         */
        sTranslate.translate = function (key, interpolateParams) {
            if (!key || typeof key !== 'string') throw new Error('sTranslate.translate()', 'Invalid parameter value', arguments);

            key = key.toUpperCase();

            return $filter('translate')(key, interpolateParams);
        };

        /**
         * A method to convert errors in response object to translation keys
         *
         * NOTE: Not returning the whole translated message as placeholders may need to be substituted
         *
         * @param {object} errorResponse Response object
         * @param {string} model Model - the context for ex "User", "Vote". So that for example Groups API property "name" and User API property "name" could have different messages
         */
        sTranslate.errorsToKeys = function (errorResponse, model) {
            if (!errorResponse || !model) {
                throw new Error('sTranslate.errorsToKeys()', 'Missing one or more required parameters', arguments);
            }

            var fieldErrors = errorResponse.data.errors;

            if (fieldErrors) {
                return fieldErrorsToKeys(errorResponse, model);
            } else {
                return generalErrorToKey(errorResponse, model);
            }
        };

        var fieldErrorsToKeys = function (errorResponse, model) {
            if (_.values(sTranslate.models).indexOf(model) < 0) {
                throw new Error('sTranslate.fieldErrorsToKeys', 'Unsupported model provided', model);
            }

            var errors = errorResponse.data.errors;

            Object.keys(errors).forEach(function (key) {
                var translationKey = FIELD_ERROR_KEY_PATTERN
                    .replace(':statusCode', errorResponse.data.status.code)
                    .replace(':model', model.toUpperCase())
                    .replace(':fieldName', key.toUpperCase());

                // "Check" if key exists, if it does, replace the API message with translation key.
                // If it does not, leave the API message as a fallback.
                // The key exists
                if (translationKey !== sTranslate.translate(translationKey)) {
                    errors[key] = translationKey;
                } else {
                    $log.warn('sTranslate.fieldErrorsToKeys()', 'Translation not found', translationKey, errorResponse);
                }
            });
        };

        var generalErrorToKey = function (errorResponse, model) {
            if (_.values(sTranslate.models).indexOf(model) < 0) {
                throw new Error('sTranslate.fieldErrorsToKeys', 'Unsupported model provided', model);
            }

            var translationKey = GENERAL_ERROR_KEY_PATTERN
                .replace(':statusCode', errorResponse.data.status.code)
                .replace(':model', model.toUpperCase());

            var translationKeyFallback = GENERAL_ERROR_FALLBACK_KEY_PATTERN
                .replace(':statusCode', errorResponse.data.status.code);

            // The key exists
            if (translationKey !== sTranslate.translate(translationKey)) {
                errorResponse.data.status.message = translationKey;
                // Use fallback to generic error
            } else if (translationKeyFallback !== sTranslate.translate(translationKeyFallback)) {
                errorResponse.data.status.message = translationKeyFallback;
            } else {
                $log.warn('sTranslate.generalErrorToKey()', 'Translation not found for key', translationKey, errorResponse);
            }
        };

    }]);
