'use strict';

angular
    .module('citizenos')
    .controller('TopicAttachmentsCtrl', ['$scope', '$state', '$stateParams', '$log', '$document', '$translate', 'sNotification', 'sUpload', 'sAttachment', 'TopicAttachment', 'ngDialog', function ($scope, $state, $stateParams, $log, $document, $translate, sNotification, sUpload, sAttachment, TopicAttachment, ngDialog) {
        $log.debug('TopicAttachmentsCtrl', $state, $stateParams);

        $scope.form = {
            files: []
        };

        $scope.saveInProgress = false;

        $scope.init = function () {
            TopicAttachment
                .query({topicId: $scope.topic.id}).$promise
                .then(function (attachments) {
                    $scope.form.files = attachments;
                });
        };

        $scope.init();

        $scope.uploadFile = function () {
            $document[0].getElementById('addFile').click();
        };

        $scope.selectFile = function (files) {
            for (var i = 0; i < files.length; i++) {
                var attachment = {
                    name: files[i].name,
                    type: files[i].name.split('.').pop(),
                    source: 'upload',
                    size: files[i].size,
                    file: files[i]
                };

                if (attachment.size > 50000000) {
                    sNotification.addError('MSG_ERROR_ATTACHMENT_SIZE_OVER_LIMIT');
                } else if (sUpload.ALLOWED_FILE_TYPES.indexOf(attachment.type.toLowerCase()) === -1) {
                    var fileTypeError = $translate.instant('MSG_ERROR_ATTACHMENT_TYPE_NOT_ALLOWED', {allowedFileTypes: sUpload.ALLOWED_FILE_TYPES.toString()});
                    sNotification.addError(fileTypeError);
                } else {
                    $scope.appendAttachment(attachment);
                }
            }
        };

        function handleAttachment (attachment) {
            if (attachment) {
                $scope.appendAttachment(attachment);
            }
        }

        $scope.dropboxSelect = function () {
            sAttachment
                .dropboxSelect()
                .then(handleAttachment);
        };

        $scope.oneDriveSelect = function () {
            sAttachment
                .oneDriveSelect()
                .then(handleAttachment);
        };

        $scope.googleDriveSelect = function () {
            sAttachment
                .googleDriveSelect()
                .then(handleAttachment);
        };

        $scope.appendAttachment = function (attachment) {
            $scope.doSaveAttachment(attachment);
        };

        $scope.doSaveAttachment = function (attachment) {
            if (attachment.file) {
                sUpload.topicAttachment($scope.topic.id, attachment)
                .then(function (result) {
                    var topicAttachment = new TopicAttachment(result.data);
                    $scope.form.files.push(topicAttachment);
                }).catch(function (err) {
                    if (err.data.errors) {
                        var keys = Object.keys(err.data.errors);
                        keys.forEach(function (key) {
                            sNotification.addError(err.data.errors[key]);
                        });
                    } else if (err.data.status && err.data.status.message) {
                        sNotification.addError(err.data.status.message);
                    } else {
                        sNotification.addError(err.message);
                    }
                });
            } else {
                attachment.topicId = $scope.topic.id;
                var topicAttachment = new TopicAttachment(attachment);
                if (topicAttachment.id) {
                    topicAttachment.$update();
                } else {
                    topicAttachment.$save();
                }

                $scope.form.files.push(topicAttachment);
            }
        };

        $scope.editAttachment = function (attachment) {
            attachment.editMode = !attachment.editMode;
            attachment.topicId = $scope.topic.id;
            var topicAttachment = new TopicAttachment(attachment);
            if (!attachment.editMode && attachment.id) {
                topicAttachment.$update();
            }
        };

        $scope.deleteAttachment = function (key, attachment) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_attachment_delete_confirm.html'
                })
                .then(function () {
                    $scope.form.files.splice(key, 1);
                    if (attachment.id) {
                        TopicAttachment.delete({
                            attachmentId: attachment.id,
                            topicId: $scope.topic.id
                        });
                    }
                }, angular.noop);
        };
    }]);
