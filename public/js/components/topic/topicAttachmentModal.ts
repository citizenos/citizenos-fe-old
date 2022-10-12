'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let topicAttachmentModal = {
    selector: 'topicAttachmentModal',
    templateUrl: '/views/modals/topic_attachments.html',
    controller: ['$log', '$document', '$translate', 'sNotification', 'sUpload', 'sAttachment', 'TopicAttachment', 'ngDialog', 'AppService', class TopicAttachmentsController {
        public form = {
            files: [],
            uploadfiles: []
        };
        private saveInProgress = false;
        public topic;
        private app;

        constructor ($log, private $document, private $translate, private sNotification, private sUpload, private sAttachment, private TopicAttachment, private ngDialog, AppService) {
            $log.debug('TopicAttachmentsCtrl');
            this.app = AppService;
            this.topic = AppService.topic;
            this.init();
            this.handleAttachment = angular.bind(this, this.handleAttachment);
        }

        init () {
            const self = this;
            self.TopicAttachment
                .query({topicId: self.topic.id}).$promise
                .then((attachments) => {
                    self.form.files = attachments;
                });
        };

        uploadFile () {
            const self = this;
            const input = $(this.$document[0].getElementById('addFile')).find('input');
            input.click();

            input.on('change', (e) => {
                const files = e.target['files'];
                this.selectFile(files);
            });
        };

        selectFile (files) {
            for (let i = 0; i < files.length; i++) {
                const attachment = {
                    name: files[i].name,
                    type: files[i].name.split('.').pop(),
                    source: 'upload',
                    size: files[i].size,
                    file: files[i]
                };

                if (attachment.size > 50000000) {
                    this.sNotification.addError('MSG_ERROR_ATTACHMENT_SIZE_OVER_LIMIT');
                } else if (this.sUpload.ALLOWED_FILE_TYPES.indexOf(attachment.type.toLowerCase()) === -1) {
                    const fileTypeError = this.$translate.instant('MSG_ERROR_ATTACHMENT_TYPE_NOT_ALLOWED', {allowedFileTypes: this.sUpload.ALLOWED_FILE_TYPES.toString()});
                    this.sNotification.addError(fileTypeError);
                } else {
                    this.appendAttachment(attachment);
                }
            }
        };

        handleAttachment (attachment) {
            if (attachment) {
                this.appendAttachment(attachment);
            }
        }

        dropboxSelect () {
            const self = this;
            this.sAttachment
                .dropboxSelect()
                .then(self.handleAttachment);
        };

        oneDriveSelect () {
            const self = this;
            this.sAttachment
                .oneDriveSelect()
                .then(self.handleAttachment);
        };

        googleDriveSelect () {
            const self = this;
            this.sAttachment
                .googleDriveSelect()
                .then(self.handleAttachment);
        };

        appendAttachment (attachment) {
            this.doSaveAttachment(attachment);
        };

        doSaveAttachment (attachment) {
            const self = this;
            if (attachment.file) {
                return self.sUpload.topicAttachment(self.topic.id, attachment)
                .then((result) => {
                    var topicAttachment = new self.TopicAttachment(result.data);
                    self.form.files.push(topicAttachment);
                }).catch((err) => {
                    if (err.data.errors) {
                        var keys = Object.keys(err.data.errors);
                        keys.forEach(function (key) {
                            self.sNotification.addError(err.data.errors[key]);
                        });
                    } else if (err.data.status && err.data.status.message) {
                        self.sNotification.addError(err.data.status.message);
                    } else {
                        self.sNotification.addError(err.message);
                    }
                });
            }
            attachment.topicId = self.topic.id;
            const topicAttachment = new self.TopicAttachment(attachment);
            if (topicAttachment.id) {
                topicAttachment.$update();
            } else {

                topicAttachment.$update();
            }

            self.form.files.push(topicAttachment);
        };

        editAttachment (attachment) {
            attachment.editMode = !attachment.editMode;
            attachment.topicId = this.topic.id;
            const topicAttachment = new this.TopicAttachment(attachment);
            if (!attachment.editMode && attachment.id) {
                topicAttachment.$update();
            }
        };

        deleteAttachment (key, attachment) {
            const self = this;
            self.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_attachment_delete_confirm.html'
                })
                .then(() => {
                    self.form.files.splice(key, 1);
                    if (attachment.id) {
                        self.TopicAttachment.delete({
                            attachmentId: attachment.id,
                            topicId: self.topic.id
                        });
                    }
                }, angular.noop);
        };
    }]
}

angular
    .module('citizenos')
    .component(topicAttachmentModal.selector, topicAttachmentModal);
