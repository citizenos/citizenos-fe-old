'use strict';

angular
    .module('citizenos')
    .controller('TopicReportReviewFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicReport', function ($scope, $log, ngDialog, TopicReport) {
        $log.debug('TopicReportReviewFormCtrl', $scope.topic);

        $scope.form = {
            text: null,
            errors: null
        };

        $scope.doReview = function () {
            console.log('DO REVIEW!');
        };

    }]);
