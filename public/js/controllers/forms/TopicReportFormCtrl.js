'use strict';

angular
    .module('citizenos')
    .controller('TopicReportFormCtrl', ['$scope', '$log', 'ngDialog', 'Topic', function ($scope, $log, ngDialog, Topic) {
        $log.debug('TopicReportFormCtrl', $scope.topic);

        $scope.reportTypes = Topic.REPORT_TYPES; // FIXME! Should they be in Topic?

        $scope.form = {
            type: null,
            text: null
        };

        $scope.doReport = function () {
            console.log('FIXME: IMPLEMENT!');
        };

    }]);
