'use strict';

angular
    .module('citizenos')
    .controller('TopicReportModerateFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicReport', function ($scope, $log, ngDialog, TopicReport) {
        $log.debug('TopicReportModerateFormCtrl', $scope.topic);

        $scope.reportTypes = TopicReport.TYPES;

        $scope.form = {
            type: null,
            text: null,
            topicId: $scope.topic.id,
            errors: null
        };

        $scope.doModerate = function () {
            //FIXME: Implement!
            var topicReport = new TopicReport();

            topicReport.type = $scope.form.type;
            topicReport.text = $scope.form.text;

            $scope.form.errors = null;

            topicReport
                .$moderate({topicId: $scope.topic.id, id: $scope.topic.report.id})
                .then(
                    function () {
                        ngDialog.closeAll();
                    },
                    function (res) {
                        $scope.form.errors = res.data.errors;
                    }
                );
        };

    }]);
