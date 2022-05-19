'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .controller('TopicReportResolveFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicReport', function ($scope, $log, ngDialog, TopicReport) {
        $scope.form = {
            isLoading: false
        };

        $scope.doResolve = function () {
            $scope.form.isLoading = true;

            TopicReport
                .resolve(
                    {
                        topicId: $scope.topic.id,
                        id: $scope.topic.report.id
                    },
                    {} // HACK: If I don't add empty params, it will call invalid url adding reportId as a GET parameter.
                )
                .$promise
                .then(
                    function () {
                        delete $scope.topic.report;

                        ngDialog.closeAll();
                    },
                    function (res) {
                        $scope.form.isLoading = false;
                        $log.error('Failed to resolve the report', res);
                    }
                );
        };

    }]);

