'use strict';

angular
    .module('citizenos')
    .controller('TopicReportFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicComment', function ($scope, $log, ngDialog, TopicComment) {
        $log.debug('TopicReportFormCtrl', $scope.topic);

        $scope.reportTypes = TopicComment.COMMENT_REPORT_TYPES; // FIXME!

        $scope.form = {
            type: null,
            text: null
        };

        $scope.doReport = function () {
            console.log('FIXME: IMPLEMENT!');
        };

    }]);
