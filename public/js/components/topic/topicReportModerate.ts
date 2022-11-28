'use strict';
import * as angular from 'angular';

let topicReportModerate = {
    selector: 'topicReportModerate',
    templateUrl: '/views/components/topic/topic_reports_reportId_moderate.html',
    bindings: {},
    controller: ['$log', 'ngDialog', 'TopicReport', 'AppService', class TopicReportModerateController {
        private reportTypes;
        private topic;
        private form = {
            moderatedReasonType: null,
            moderatedReasonText: null,
            topicId: null,
            errors: null,
            isLoading: false
        };
        constructor (private $log, private ngDialog, private TopicReport, private app) {
            this.reportTypes = TopicReport.TYPES
            this.topic = app.topic;
            this.form.topicId = app.topic.id;
        }

        doModerate () {
            this.form.errors = null;
            this.form.isLoading = true;

            this.TopicReport
                .moderate(
                    {
                        topicId: this.topic.id, id: this.topic.report.id
                    },
                    {
                        type: this.form.moderatedReasonType,
                        text: this.form.moderatedReasonText
                    }
                )
                .$promise
                .then((report) => {
                    this.topic.report = report;
                    this.ngDialog.closeAll();
                },(res) => {
                    this.form.isLoading = false;
                    this.form.errors = res.data.errors;
                });
        };
    }]
};

angular
    .module('citizenos')
    .component(topicReportModerate.selector, topicReportModerate);