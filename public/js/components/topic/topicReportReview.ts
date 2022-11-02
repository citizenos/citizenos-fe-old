'use strict';
import * as angular from 'angular';

let topicReportReview = {
    selector: 'topicReportReview',
    templateUrl: '/views/components/topic/topic_reports_reportId_review.html',
    bindings: {},
    controller: ['$log', 'ngDialog', 'TopicReport', 'AppService',class TopicReportReviewController {
        private topic;
        private isLoading = false;
        private errors;
        private text;

        constructor (private $log, private ngDialog, private TopicReport, private app) {
            this.topic = app.topic;
        }

        doReview () {
            this.isLoading = true;

            this.TopicReport
                .review(
                    {
                        topicId: this.topic.id,
                        id: this.topic.report.id
                    },
                    {
                        text: this.text
                    }
                )
                .$promise
                .then(() => {
                    this.ngDialog.closeAll();
                },(res) => {
                    this.isLoading = false;
                    this.errors = res.data.errors;
                });
        };
    }]
}

angular
    .module('citizenos')
    .component(topicReportReview.selector, topicReportReview);