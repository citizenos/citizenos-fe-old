'use strict';

angular
    .module('citizenos')
    .service('sTranslate', ['$state', '$translate', '$log', 'cosConfig', function ($state, $translate, $log, cosConfig) {
        var sTranslate = this;

        var GENERAL_ERROR_KEY_PATTERN = 'MSG_ERROR_:statusCode_:model';
        var GENERAL_ERROR_FALLBACK_KEY_PATTERN = 'MSG_ERROR_:statusCode';
        var FIELD_ERROR_KEY_PATTERN = 'MSG_ERROR_:statusCode_:model_:fieldName';

        sTranslate.LANGUAGES = Object.keys(cosConfig.language.list);
        sTranslate.currentLanguage = cosConfig.language.default;

        var init = function () {
            var clientLang = $translate.resolveClientLocale();
            if (sTranslate.LANGUAGES.indexOf(clientLang) > -1) {
                sTranslate.currentLanguage = clientLang;
            }
        };
        init();

        sTranslate.setLanguage = function (language) {
            if (checkLanguageIsValid(language) && $translate.use() !== language) {
                $log.debug('setLanguage', language);
                sTranslate.currentLanguage = language;
                return $translate.use(language);
            }
            return $translate.use();
        };

        sTranslate.switchLanguage = function (language) {
            $log.debug('switch language', language);
            if (checkLanguageIsValid(language)) {
                $state.transitionTo($state.current.name, {language: language});
            }
            sTranslate.setLanguage(language);
        };

        var checkLanguageIsValid = function (language) {
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
            if (!errorResponse || !model) throw new Error('sTranslate.errorsToKeys()', 'Missing one or more required parameters', arguments);

            var errors = errorResponse.data.errors;

            // Field error
            if (errors) {
                return fieldErrorsToKeys(errorResponse, model);
            } else {
                // General error
                return generalErrorToKey(errorResponse, model);
            }
        };

        var fieldErrorsToKeys = function (errorResponse, model) {
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
            $log.debug('sTranslate._generalErrorToKey'.arguments);
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
