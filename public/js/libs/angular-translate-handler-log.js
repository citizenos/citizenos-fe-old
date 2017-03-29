/*!
 * angular-translate - v2.6.1 - 2015-03-01
 * http://github.com/angular-translate/angular-translate
 * Copyright (c) 2015 ; Licensed MIT
 */
angular.module('pascalprecht.translate')

    /**
     * @ngdoc object
     * @name pascalprecht.translate.$translateMissingTranslationHandlerLog
     * @requires $log
     *
     * @description
     * Uses angular's `$log` service to give a warning when trying to translate translation id which doesn't exist.
     *
     * @returns {function} Handler function
     */
    .factory('$translateMissingTranslationHandlerLog', ['$log', function ($log) {
        return function (translationId, lang) {
            // Custom vote labels are generated from options and it's OK if they don't exist.
            if (translationId.indexOf('VIEWS.TOPICS_TOPICID.VOTE_LBL_OPTION_') === -1) {
                $log.warn('$translateMissingTranslationHandlerLog', 'Translation for \'' + translationId + '\' doesn\'t exist in language \'' + lang + '\'');
            }
        };
    }]);
