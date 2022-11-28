'use strict';
import * as angular from 'angular';

let replyEdit = {
    selector: 'replyEdit',
    templateUrl: '/views/components/topic/reply_edit.html',
    bindings: {
        reply: '=',
        topicId: '='
    },
    controller: ['$log', '$state', 'AppService', 'TopicComment', class ReplyEditController {
        private topicId;

        public reply;
        public COMMENT_TYPES;
        public COMMENT_TYPES_MAXLENGTH;
        public COMMENT_SUBJECT_MAXLENGTH;
        private COMMENT_VERSION_SEPARATOR = '_v';

        constructor (private $log, private $state, private app, private TopicComment) {
            $log.debug('CommentEditController');
            this.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
            this.COMMENT_TYPES_MAXLENGTH = TopicComment.COMMENT_TYPES_MAXLENGTH;
            this.COMMENT_SUBJECT_MAXLENGTH = TopicComment.COMMENT_SUBJECT_MAXLENGTH;
        }

        updateComment () {
            if (this.reply.editType !== this.reply.type || this.reply.subject !== this.reply.editSubject || this.reply.text !== this.reply.editText) {
                this.reply.subject = this.reply.editSubject;
                this.reply.text = this.reply.editText;
                this.reply.type = this.reply.editType;
                this.reply.topicId = this.topicId;

                this.TopicComment
                    .update(this.reply)
                    .then((commentUpdated) => {
                        delete this.reply.errors;
                        return this.$state.go(
                            this.$state.current.name,
                            {
                                commentId: this.getCommentIdWithVersion(commentUpdated.id, commentUpdated.edits.length)
                            }
                        );
                    }, (err) => {
                        this.$log.error('Failed to update comment', this.reply, err);
                        this.reply.errors = err.data.errors;
                    });
            } else {
                this.commentEditMode();
            }
        };

        getCommentIdWithVersion (commentId, version) {
            return commentId + this.COMMENT_VERSION_SEPARATOR + version;
        };

        commentEditMode () {
            this.reply.editSubject = this.reply.subject;
            this.reply.editText = this.reply.text;
            this.reply.editType = this.reply.type;
            if (this.reply.showEdit) { // Visible, so we gonna hide, need to clear form errors
                delete this.reply.errors;
            }
            this.reply.showEdit = !this.reply.showEdit;
        };
    }]
}
angular
    .module('citizenos')
    .component(replyEdit.selector, replyEdit);
