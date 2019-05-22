'use strict';

angular
    .module('citizenos')
    .controller('TopicReportReviewFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicReport', function ($scope, $log, ngDialog, TopicReport) {
        $log.debug(' ', $scope.topic);

        $scope.form = {
            text: null,
            errors: null
        };

        $scope.doReview = function () {
            TopicReport
                .review(
                    {
                        topicId: $scope.topic.id,
                        id: $scope.topic.report.id
                    },
                    {
                        text: $scope.form.text
                    }
                )
                .$promise
                .then(
                    function (data) {
                        ngDialog.closeAll();
                    },
                    function (res) {
                        $scope.form.errors = res.data.errors;
                    }
                );
        };

    }]);
