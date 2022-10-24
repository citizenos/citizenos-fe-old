'use strict';
import * as angular from 'angular';

let commentEdit = {
    selector: 'commentEdit',
    templateUrl: '/views/components/comment_edit.html',
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

        constructor (private $log, private $state, AppService, TopicComment) {
            $log.debug('CommentEditController');
            this.app = AppService;
            this.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
            this.COMMENT_TYPES_MAXLENGTH = TopicComment.COMMENT_TYPES_MAXLENGTH;
            this.COMMENT_SUBJECT_MAXLENGTH = TopicComment.COMMENT_SUBJECT_MAXLENGTH;
        }

        updateComment () {
            if (this.comment.editType !== this.comment.type || this.comment.subject !== this.comment.editSubject || this.comment.text !== this.comment.editText) {
                this.comment.subject = this.comment.editSubject;
                this.comment.text = this.comment.editText;
                this.comment.type = this.comment.editType;
                this.comment.topicId = this.topicId;

                this.comment
                    .$update()
                    .then((commentUpdated) => {
                        delete this.comment.errors;
                        return this.$state.go(
                            this.$state.current.name,
                            {
                                commentId: this.getCommentIdWithVersion(commentUpdated.id, commentUpdated.edits.length)
                            }
                        );
                    }, (err) => {
                        this.$log.error('Failed to update comment', this.comment, err);
                        this.comment.errors = err.data.errors;
                    });
            } else {
                this.commentEditMode();
            }
        };

        getCommentIdWithVersion (commentId, version) {
            return commentId + this.COMMENT_VERSION_SEPARATOR + version;
        };

        commentEditMode () {
            this.comment.editSubject = this.comment.subject;
            this.comment.editText = this.comment.text;
            this.comment.editType = this.comment.type;
            if (this.comment.showEdit) { // Visible, so we gonna hide, need to clear form errors
                delete this.comment.errors;
            }
            this.comment.showEdit = !this.comment.showEdit;
        };
    }]
}
angular
    .module('citizenos')
    .component(commentEdit.selector, commentEdit);
