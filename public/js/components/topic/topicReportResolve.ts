'use strict';
import * as angular from 'angular';

let topicReportResolve = {
    selector: 'topicReportResolve',
    templateUrl: '/views/components/topic/topic_reports_reportId_resolve.html',
    bindings: {},
    controller: ['$log', 'ngDialog', 'TopicReport', 'AppService',class TopicReportResolveController {
        private topic;

        private form = {
            isLoading: false
        };

        private errors;

        constructor (private $log, private ngDialog, private TopicReport, private app) {
            this.topic = app.topic;
        }

        doResolve = function () {
            this.form.isLoading = true;

            this.TopicReport
                .resolve(
                    {
                        topicId: this.topic.id,
                        id: this.topic.report.id
                    },
                    {} // HACK: If I don't add empty params, it will call invalid url adding reportId as a GET parameter.
                )
                .$promise
                .then(() => {
                    delete this.topic.report;
                    this.ngDialog.closeAll();
                },(res) => {
                    this.form.isLoading = false;
                    this.$log.error('Failed to resolve the report', res);
                });
        };
    }]
}

angular
    .module('citizenos')
    .component(topicReportResolve.selector, topicReportResolve);