'use strict';
import * as angular from 'angular';

let postArgument = {
    selector: 'postArgument',
    templateUrl: '/views/components/topic/post_argument.html',
    bindings: {
        topicId: '='
    },
    controller: ['$state', 'AppService', 'TopicComment', class PostArgumentController {
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
        constructor (private $state, public app, private TopicComment) {
            this.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
            delete this.COMMENT_TYPES[TopicComment.COMMENT_TYPES.reply];
            this.COMMENT_TYPES_MAXLENGTH = TopicComment.COMMENT_TYPES_MAXLENGTH;
            this.COMMENT_SUBJECT_MAXLENGTH = TopicComment.COMMENT_SUBJECT_MAXLENGTH;
        }

        saveComment () {
            const comment = {
                parentVersion: 0,
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
    .component(postArgument.selector, postArgument);
