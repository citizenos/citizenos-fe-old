'use strict';
import * as angular from 'angular';

let postArgument = {
    selector: 'postArgument',
    templateUrl: '/views/components/post_argument.html',
    bindings: {
        topicId: '='
    },
    controller: ['$state', 'AppService', 'TopicComment', class PostArgumentController {
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
        constructor (private $state, AppService, private TopicComment) {
            this.app = AppService;
            this.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
            delete this.COMMENT_TYPES[TopicComment.COMMENT_TYPES.reply];
            this.COMMENT_TYPES_MAXLENGTH = TopicComment.COMMENT_TYPES_MAXLENGTH;
            this.COMMENT_SUBJECT_MAXLENGTH = TopicComment.COMMENT_SUBJECT_MAXLENGTH;
        }

        saveComment () {
            const comment = new this.TopicComment();
            comment.parentId = comment.id;
            comment.parentVersion = 0;
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
    .component(postArgument.selector, postArgument);
