'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .controller('TopicReportReviewFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicReport', function ($scope, $log, ngDialog, TopicReport) {
        $scope.form = {
            text: null,
            errors: null,
            isLoading: false
        };

        $scope.doReview = function () {
            $scope.form.isLoading = true;

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
                    function () {
                        ngDialog.closeAll();
                    },
                    function (res) {
                        $scope.form.isLoading = false;
                        $scope.form.errors = res.data.errors;
                    }
                );
        };

    }]);
