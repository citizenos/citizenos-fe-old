'use strict';
import * as angular from 'angular';

let commentReply = {
    selector: 'commentReply',
    templateUrl: '/views/components/comment_reply.html',
    bindings: {
        comment: '=',
        topicId: '='
    },
    controller: ['$log', '$state', 'AppService', 'TopicComment', class CommentEditController {
        private topicId;

        public app;
        public comment;
        public COMMENT_TYPES;
        public COMMENT_TYPES_MAXLENGTH;
        public COMMENT_SUBJECT_MAXLENGTH;
        private COMMENT_VERSION_SEPARATOR = '_v';
        public form = {
            subject: null,
            type: null,
            text: null,
            errors: null
        }
        constructor ($log, private $state, AppService, private TopicComment) {
            $log.debug('CommentEditController');
            this.app = AppService;
            this.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
            this.COMMENT_TYPES_MAXLENGTH = TopicComment.COMMENT_TYPES_MAXLENGTH;
            this.COMMENT_SUBJECT_MAXLENGTH = TopicComment.COMMENT_SUBJECT_MAXLENGTH;
        }

        submitReply (parentId, parentVersion) {
            this.form.subject = null;
            this.saveComment();
        };

        saveComment () {
            const comment = new this.TopicComment();
            comment.parentId = this.comment.id;
            comment.parentVersion = (this.comment.edits.length-1);
            comment.type = this.form.type;
            comment.subject = this.form.subject;
            comment.text = this.form.text;

            this.form.errors = null;

            comment
                .$save({topicId: this.topicId})
                .then((comment) => {
                        return this.$state.go(
                            this.$state.current.name,
                            {commentId: this.getCommentIdWithVersion(comment.id, comment.edits.length - 1)}
                        );
                    },
                    function (res) {
                        this.form.errors = res.data.errors;
                    }
                );
        };

        getCommentIdWithVersion (commentId, version) {
            return commentId + this.COMMENT_VERSION_SEPARATOR + version;
        };
    }]
}
angular
    .module('citizenos')
    .component(commentReply.selector, commentReply);
