angular
    .module('citizenos')
    .factory('cosHttpApiErrorInterceptor', ['$log', '$q', '$translate', '$filter', function ($log, $q, $translate, $filter) {
        $log.debug('citizenos.factory.cosHttpApiErrorInterceptor');

        var API_REQUEST_REGEX = /\/api\/.*/i;

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
        var translate = function (key, interpolateParams) {
            if (!key || typeof key !== 'string') throw new Error('cosHttpInterceptor.translate()', 'Invalid parameter value', arguments);
            return $filter('translate')(key, interpolateParams);
        };

        /**
         * A method to convert errors in response object to translation keys
         *
         * NOTE: Not returning the whole translated message as placeholders may need to be substituted
         *
         * @param {object} errorResponse Response object
         */
        var errorsToKeys = function (errorResponse) {
            if (!errorResponse) {
                throw new Error('cosHttpApiErrorInterceptor.errorsToKeys()', 'Missing one or more required parameters', arguments);
            }

            if (errorResponse.data && errorResponse.data.errors) {
                return fieldErrorsToKeys(errorResponse);
            } else {
                return generalErrorToKey(errorResponse);
            }
        };

        var getGeneralErrorTranslationKey = function (errorResponse) {
            var GENERAL_ERROR_KEY_PATTERN = 'MSG_ERROR_:method_:path_:statusCode';

            var config = errorResponse.config;
            var data = errorResponse.data;
            var path = config.url.match(API_REQUEST_REGEX)[0]
                .replace(/\/self\//g, '_')
                .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig, '_')
                .replace(/\//g, '_');
            var statusCode = (data.status && data.status.code) ? data.status.code : errorResponse.status;

            return GENERAL_ERROR_KEY_PATTERN
                .replace(':method', config.method)
                .replace(':path', path)
                .replace(':statusCode', statusCode)
                .replace(/[_]+/g, '_')
                .toUpperCase();

        };

        var fieldErrorsToKeys = function (errorResponse) {
            var errors = errorResponse.data.errors;

            Object.keys(errors).forEach(function (key) {
                var translationKey = getGeneralErrorTranslationKey(errorResponse);
                translationKey += '_' + key.toUpperCase();

                // "Check" if key exists, if it does, replace the API message with translation key.
                // If it does not, leave the API message as a fallback.
                // The key exists
                if (translationKey !== translate(translationKey)) {
                    errors[key] = translationKey;
                } else {
                    $log.warn('cosHttpApiErrorInterceptor.fieldErrorsToKeys()', 'Translation not found', translationKey, errorResponse);
                }
            });
        };

        var generalErrorToKey = function (errorResponse) {
            var GENERAL_ERROR_FALLBACK_KEY_PATTERN = 'MSG_ERROR_:statusCode';

            var translationKey = getGeneralErrorTranslationKey(errorResponse);

            var data = errorResponse.data;
            var statusCode = (data.status && data.status.code) ? data.status.code : errorResponse.status;

            var translationKeyFallback = GENERAL_ERROR_FALLBACK_KEY_PATTERN
                .replace(':statusCode', statusCode);

            // The key exists
            if (translationKey !== translate(translationKey)) {
                errorResponse.data.status.message = translationKey;
                // Use fallback to generic error
            } else if (translationKeyFallback !== translate(translationKeyFallback)) {
                errorResponse.data.status.message = translationKeyFallback;
            } else {
                $log.warn('cosHttpApiErrorInterceptor.generalErrorToKey()', 'Translation not found for key', translationKey, errorResponse);
            }
        };

        return {
            'responseError': function (response) {
                if (response.config.url.match(API_REQUEST_REGEX)) {
                    try {
                        errorsToKeys(response);
                    } catch (err) {
                        // Catch all so that promise get rejected later with response to continue interceptor chain
                        $log.error('cosHttpApiErrorInterceptor.responseError', 'Failed to translate errors', response, err);
                    }
                }

                return $q.reject(response);
            }
        };

    }]);
