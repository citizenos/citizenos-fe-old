'use strict';
import * as angular from 'angular';

let topicCommentModerate = {
    selector: 'topicCommentModerate',
    templateUrl: '/views/components/topic/topic_comment_moderate.html',
    bindings: {},
    controller: ['$state', '$stateParams', '$http', 'sLocation', 'TopicComment', 'AppService', class TopicCommentModerateController {
        private comment;
        private reportTypes;
        private topic;
        private reportId;
        private errors;
        private token;
        private form = {
            type: null,
            text: null
        };
        constructor (private $state, private $stateParams, private $http, private sLocation, private TopicComment, private app) {
            this.topic = app.topic;
            this.reportId = $stateParams.reportId;
            this.token = $stateParams.token;
            this.reportTypes = TopicComment.COMMENT_REPORT_TYPES;
            const path = sLocation.getAbsoluteUrlApi(
                '/api/topics/:topicId/comments/:reportedCommentId/reports/:reportId',
                $stateParams
            );

            const config = {
                headers: {
                    'Authorization': 'Bearer ' + $stateParams.token
                }
            };

            $http
                .get(path, config)
                .then((res) => {
                    return this.comment = res.data.data.comment;
                });
        }

        doModerate () {
            const path = this.sLocation.getAbsoluteUrlApi(
                '/api/topics/:topicId/comments/:commentId/reports/:reportId/moderate',
                {
                    topicId: this.topic.id,
                    commentId: this.comment.id,
                    reportId: this.reportId
                }
            );
            const config = {
                headers: {
                    'Authorization': 'Bearer ' + this.token
                }
            };

            this.$http
                .post(path, this.form, config)
                .then(() => {
                        return this.$state.go('topics/view', {language: this.$stateParams.language, topicId: this.topic.id}, {reload: true});
                    },(res) => {
                        this.errors = res.data.errors;
                    }
                );
        };
    }]
};

angular
    .module('citizenos')
    .component(topicCommentModerate.selector, topicCommentModerate);