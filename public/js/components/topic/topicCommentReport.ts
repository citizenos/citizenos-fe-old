'use strict';
import * as angular from 'angular';

let topicCommentReport = {
    selector: 'topicCommentReport',
    templateUrl: '/views/components/topic/topic_comment_report.html',
    bindings: {
        commentId: '@'
    },
    controller: ['$log', 'ngDialog', 'TopicComment', 'AppService', 'TopicCommentService', class TopicCommentReportController {
        private comment;
        private commentId;
        private reportTypes;

        private form = {
            type: null,
            text: null,
            topicId: null,
            id: null
        };
        private errors;

        constructor (private $log, private ngDialog, private TopicComment, private app, TopicCommentService) {
            const comment = TopicCommentService.comments.find((comment) => {return comment.id === this.commentId});
            this.reportTypes = TopicComment.COMMENT_REPORT_TYPES;
            this.comment = comment;
            this.form.id = comment.id
            this.form.topicId = app.topic.id;
        }

        doReport () {
            this.TopicComment.report(this.form)
                .then(() => {
                    this.ngDialog.closeAll();
                }, (res) => {
                    this.errors = res.data.errors;
                });
        };
    }]
}

angular
    .module('citizenos')
    .component(topicCommentReport.selector, topicCommentReport);