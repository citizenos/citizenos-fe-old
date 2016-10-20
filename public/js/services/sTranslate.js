'use strict';

app.service('sTranslate', ['$translate', '$filter', '$log', function ($translate, $filter, $log) {
    var Translate = this;

    var GENERAL_ERROR_KEY_PATTERN = 'MSG_ERROR_:statusCode_:model';
    var GENERAL_ERROR_FALLBACK_KEY_PATTERN = 'MSG_ERROR_:statusCode';
    var FIELD_ERROR_KEY_PATTERN = 'MSG_ERROR_:statusCode_:model_:fieldName';


    /**
     * Translate a key
     *
     * @param {string} key Translation key
     * @param {Object} [interpolateParams] Interpolate params
     *
     * @returns {string}
     *
     * @see {@link https://angular-translate.github.io/docs/#/api/pascalprecht.translate.filter:translate}
     */
    Translate.translate = function (key, interpolateParams) {
        if (!key || typeof key !== 'string') throw new Error('Invalid parameter value', arguments);

        key = key.toUpperCase();

        return $filter('translate')(key, interpolateParams);
    };

    /**
     * A method to convert errors in response object to translation keys
     *
     * NOTE: Not returning the whole translated message as placeholders may need to be substituted
     *
     * TODO: This is not the coolest way to do error translation. Specially the 'model' part.
     *
     * @param {{object}} errorResponse Response object
     * @param {{string}} model Model - the context. So that for example Groups API property "name" and User API property "name" could have different messages
     */
    Translate.errorsToKeys = function (errorResponse, model) {
        if (!errorResponse || !model) throw new Error('Translate.errorsToKeys(errorResponse, model) is missing one or more required parameters', arguments);

        var errors = errorResponse.data.errors;

        // Field error
        if (errors) {
            return _fieldErrorsToKeys(errorResponse, model);
        } else {
            // General error
            return _generalErrorToKey(errorResponse, model);
        }
    };

    var _fieldErrorsToKeys = function (errorResponse, model) {
        var errors = errorResponse.data.errors;

        Object.keys(errors).forEach(function (key) {
            var translationKey = FIELD_ERROR_KEY_PATTERN
                .replace(':statusCode', errorResponse.data.status.code)
                .replace(':model', model.toUpperCase())
                .replace(':fieldName', key.toUpperCase());

            // "Check" if key exists, if it does, replace the API message with translation key.
            // If it does not, leave the API message as a fallback.
            // The key exists
            if (translationKey !== Translate.translate(translationKey)) {
                errors[key] = translationKey;
            } else {
                $log.warn('Translation not found', translationKey, errorResponse);
            }
        });
    };

    var _generalErrorToKey = function (errorResponse, model) {
        $log.debug('sTranslate._generalErrorToKey'.arguments);
        var translationKey = GENERAL_ERROR_KEY_PATTERN
            .replace(':statusCode', errorResponse.data.status.code)
            .replace(':model', model.toUpperCase());

        var translationKeyFallback = GENERAL_ERROR_FALLBACK_KEY_PATTERN
            .replace(':statusCode', errorResponse.data.status.code);

        // The key exists
        if (translationKey !== Translate.translate(translationKey)) {
            errorResponse.data.status.message = translationKey;
        // Use fallback to generic error
        } else if (translationKeyFallback !== Translate.translate(translationKeyFallback)) {
            errorResponse.data.status.message = translationKeyFallback;
        } else {
            $log.warn('Translation not found for key', translationKey, errorResponse);
        }
    };

}]);