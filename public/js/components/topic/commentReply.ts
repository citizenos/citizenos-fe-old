'use strict';
import * as angular from 'angular';

let commentReply = {
    selector: 'commentReply',
    templateUrl: '/views/components/topic/comment_reply.html',
    bindings: {
        comment: '=',
        topicId: '='
    },
    controller: ['$log', '$state', 'AppService', 'TopicComment', class CommentEditController {
        private topicId;

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
        constructor ($log, private $state, private app, private TopicComment) {
            $log.debug('CommentEditController');
            this.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
            this.COMMENT_TYPES_MAXLENGTH = TopicComment.COMMENT_TYPES_MAXLENGTH;
            this.COMMENT_SUBJECT_MAXLENGTH = TopicComment.COMMENT_SUBJECT_MAXLENGTH;
        }

        submitReply (parentId, parentVersion) {
            this.form.subject = null;
            this.saveComment();
        };

        saveComment () {
            const comment = {
                parentId: this.comment.id,
                parentVersion: (this.comment.edits.length-1),
                type: this.form.type,
                subject: this.form.subject,
                text: this.form.text,
                topicId: this.topicId
            };

            this.form.errors = null;

            this.TopicComment
                .save(comment)
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
