'use strict';

angular
    .module('citizenos')
    .controller('TopicSettingsCtrl', ['$scope', '$state', '$stateParams', '$log', 'Topic', function ($scope, $state, $stateParams, $log, Topic) {
        $log.debug('TopicSettingsCtrl', $state, $stateParams);

    }]);
