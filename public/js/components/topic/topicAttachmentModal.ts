'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let topicAttachmentModal = {
    selector: 'topicAttachmentModal',
    templateUrl: '/views/components/topic/topic_attachments.html',
    controller: ['$log', '$document', '$translate', 'sNotification', 'sUpload', 'Topic', 'TopicAttachment', 'ngDialog', 'AppService', class TopicAttachmentsController {
        public form = {
            files: [],
            uploadfiles: []
        };
        private saveInProgress = false;
        public topic;

        constructor ($log, private $document, private $translate, private sNotification, private sUpload, private Topic, private TopicAttachment, private ngDialog, private app) {
            $log.debug('TopicAttachmentsCtrl');
            this.topic = app.topic;
            this.init();
            this.handleAttachment = angular.bind(this, this.handleAttachment);
        }

        init () {
            this.TopicAttachment
                .query({topicId: this.topic.id})
                .then((data) => {
                    this.form.files = data.rows;
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
            this.TopicAttachment
                .dropboxSelect()
                .then(this.handleAttachment);
        };

        oneDriveSelect () {
            this.TopicAttachment
                .oneDriveSelect()
                .then(this.handleAttachment);
        };

        googleDriveSelect () {
            this.TopicAttachment
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
                    this.form.files.push(result.data);
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
            if (attachment.id) {
                this.TopicAttachment.update(attachment);
            } else {
                this.TopicAttachment.save(attachment);
            }

            this.form.files.push(attachment);
        };

        editAttachment (attachment) {
            attachment.editMode = !attachment.editMode;
            attachment.topicId = this.topic.id;
            if (!attachment.editMode && attachment.id) {
                this.TopicAttachment.update(attachment);
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
