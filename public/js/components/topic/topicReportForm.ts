'use strict';
import * as angular from 'angular';

let topicReportForm = {
    selector: 'topicReportForm',
    templateUrl: '/views/components/topic/topic_report.html',
    bindings: {},
    controller: ['$log', 'ngDialog', 'TopicReport', 'AppService', class TopicReportFormController {
        private reportTypes;
        private topic;
        private form = {
            type: null,
            text: null,
            topicId: null,
            errors: null,
            isLoading: false
        };
        constructor (private $log, private ngDialog, private TopicReport, private app) {
            this.reportTypes = TopicReport.TYPES;
            this.form.topicId = app.topic.id;
            this.topic = app.topic;
        }

        doReport () {
            this.form.errors = null;
            this.form.isLoading = true;

            this.TopicReport
                .save({topicId: this.topic.id, type: this.form.type, text: this.form.text})
                .then((report) => {
                    this.topic.report = {
                        id: report.id
                    };

                    this.ngDialog.closeAll();
                    }, (res) => {
                        this.form.errors = res.data.errors;
                        this.form.isLoading = false;
                    }
                );
        };
    }]
};

angular
    .module('citizenos')
    .component(topicReportForm.selector, topicReportForm);
