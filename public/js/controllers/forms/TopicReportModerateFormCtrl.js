'use strict';

angular
    .module('citizenos')
    .controller('TopicReportModerateFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicReport', function ($scope, $log, ngDialog, TopicReport) {
        $log.debug('TopicReportModerateFormCtrl', $scope.topic);

        $scope.reportTypes = TopicReport.TYPES;

        $scope.form = {
            moderatedReasonType: null,
            moderatedReasonText: null,
            topicId: $scope.topic.id,
            errors: null
        };

        $scope.doModerate = function () {
            $scope.form.errors = null;

            TopicReport
                .moderate(
                    {
                        topicId: $scope.topic.id, id: $scope.topic.report.id
                    },
                    {
                        type: $scope.form.moderatedReasonType,
                        text: $scope.form.moderatedReasonText
                    }
                )
                .$promise
                .then(
                    function (report) {
                        $scope.topic.report = report;
                        ngDialog.closeAll();
                    },
                    function (res) {
                        $scope.form.errors = res.data.errors;
                    }
                );
        };

    }]);
