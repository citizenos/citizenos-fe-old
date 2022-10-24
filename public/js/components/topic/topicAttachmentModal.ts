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
            this.TopicAttachment
                .query({topicId: this.topic.id}).$promise
                .then((attachments) => {
                    this.form.files = attachments;
                });
        };

        uploadFile () {
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
            this.sAttachment
                .dropboxSelect()
                .then(this.handleAttachment);
        };

        oneDriveSelect () {
            this.sAttachment
                .oneDriveSelect()
                .then(this.handleAttachment);
        };

        googleDriveSelect () {
            this.sAttachment
                .googleDriveSelect()
                .then(this.handleAttachment);
        };

        appendAttachment (attachment) {
            this.doSaveAttachment(attachment);
        };

        doSaveAttachment (attachment) {
            if (attachment.file) {
                return this.sUpload.topicAttachment(this.topic.id, attachment)
                .then((result) => {
                    var topicAttachment = new this.TopicAttachment(result.data);
                    this.form.files.push(topicAttachment);
                }).catch((err) => {
                    if (err.data.errors) {
                        var keys = Object.keys(err.data.errors);
                        keys.forEach(function (key) {
                            this.sNotification.addError(err.data.errors[key]);
                        });
                    } else if (err.data.status && err.data.status.message) {
                        this.sNotification.addError(err.data.status.message);
                    } else {
                        this.sNotification.addError(err.message);
                    }
                });
            }
            attachment.topicId = this.topic.id;
            const topicAttachment = new this.TopicAttachment(attachment);
            if (topicAttachment.id) {
                topicAttachment.$update();
            } else {

                topicAttachment.$update();
            }

            this.form.files.push(topicAttachment);
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
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_attachment_delete_confirm.html'
                })
                .then(() => {
                    this.form.files.splice(key, 1);
                    if (attachment.id) {
                        this.TopicAttachment.delete({
                            attachmentId: attachment.id,
                            topicId: this.topic.id
                        });
                    }
                }, angular.noop);
        };
    }]
}

angular
    .module('citizenos')
    .component(topicAttachmentModal.selector, topicAttachmentModal);
