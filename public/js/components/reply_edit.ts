'use strict';
import * as angular from 'angular';

let replyEdit = {
    selector: 'replyEdit',
    templateUrl: '/views/components/reply_edit.html',
    bindings: {
        reply: '=',
        topicId: '='
    },
    controller: ['$log', '$state', 'AppService', 'TopicComment', class ReplyEditController {
        private $log;
        private $state;
        private topicId;

        public app;
        public reply;
        public COMMENT_TYPES;
        public COMMENT_TYPES_MAXLENGTH;
        public COMMENT_SUBJECT_MAXLENGTH;
        private COMMENT_VERSION_SEPARATOR = '_v';

        constructor ($log, $state, AppService, TopicComment) {
            $log.debug('CommentEditController');
            this.$log = $log;
            this.$state = $state;
            this.app = AppService;
            this.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
            this.COMMENT_TYPES_MAXLENGTH = TopicComment.COMMENT_TYPES_MAXLENGTH;
            this.COMMENT_SUBJECT_MAXLENGTH = TopicComment.COMMENT_SUBJECT_MAXLENGTH;
        }

        updateComment () {
            const self = this;
            if (this.reply.editType !== this.reply.type || this.reply.subject !== this.reply.editSubject || this.reply.text !== this.reply.editText) {
                this.reply.subject = this.reply.editSubject;
                this.reply.text = this.reply.editText;
                this.reply.type = this.reply.editType;
                this.reply.topicId = this.topicId;

                this.reply
                    .$update()
                    .then((commentUpdated) => {
                        delete self.reply.errors;
                        return self.$state.go(
                            self.$state.current.name,
                            {
                                commentId: self.getCommentIdWithVersion(commentUpdated.id, commentUpdated.edits.length)
                            }
                        );
                    }, (err) => {
                        self.$log.error('Failed to update comment', self.reply, err);
                        self.reply.errors = err.data.errors;
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
