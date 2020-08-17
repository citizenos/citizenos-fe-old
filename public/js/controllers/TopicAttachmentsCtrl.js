'use strict';

angular
    .module('citizenos')
    .controller('TopicAttachmentsCtrl', ['$scope', '$state', '$stateParams', '$log', '$document', 'Topic', 'sNotification', 'sUpload', 'sAttachment', 'TopicAttachment', 'ngDialog', function ($scope, $state, $stateParams, $log, $document, Topic, sNotification, sUpload, sAttachment, TopicAttachment, ngDialog) {
        $log.debug('TopicAttachmentsCtrl', $state, $stateParams);

        $scope.form = {
            files: []
        }

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


        $scope.selectFile = function (element) {
            var attachment = {
                name: element.files[0].name,
                type: element.files[0].name.split('.').pop(),
                source: 'upload',
                size: element.files[0].size,
                file: element.files[0]
            };

            if (attachment.size > 50000000) {
                $scope.$apply(function () {
                    sNotification.addError('MSG_ERROR_ATTACHMENT_SIZE_OVER_LIMIT');
                });

            } else if (sUpload.ALLOWED_FILE_TYPES.indexOf(attachment.type) === -1) {
                $scope.$apply(function () {
                    sNotification.addError('MSG_ERROR_ATTACHMENT_TYPE_NOT_ALLOWED');
                });
            } else {
                $scope.appendAttachment(attachment);
            }
        };

        $scope.dropboxSelect = function () {
            sAttachment
                .dropboxSelect()
                .then(function (attachment) {
                    $scope.appendAttachment(attachment);
                });
        };

        $scope.oneDriveSelect = function () {
            sAttachment
                .oneDriveSelect()
                .then(function (attachment) {
                    $scope.appendAttachment(attachment);
                });
        };

        $scope.googleDriveSelect = function () {
            sAttachment
                .googleDriveSelect()
                .then(function (attachment) {
                    $scope.appendAttachment(attachment);
                });
        };

        $scope.appendAttachment = function (attachment) {
            $scope.$apply(function () {
                $scope.doSaveAttachment(attachment);
            });
        };

        $scope.doSaveAttachment = function (attachment) {
            console.log(attachment);
            if (attachment.file) {
                return sUpload
                    .upload(attachment.file, $scope.topic.id)
                    .then(function (fileUrl) {
                        attachment.topicId = $scope.topic.id;
                        attachment.link = fileUrl;
                        var topicAttachment = new TopicAttachment(attachment);

                        topicAttachment
                            .$save()
                            .then(function () {
                                $scope.form.files.push(topicAttachment);
                            })
                            .catch(function (err) {
                                var keys = Object.keys(err.data.errors);
                                keys.forEach(function (key) {
                                    sNotification.addError(err.data.errors[key]);
                                });
                            });
                    });
            }

            attachment.topicId = $scope.topic.id;
            var topicAttachment = new TopicAttachment(attachment);
            if (topicAttachment.id) {
                topicAttachment.$update();
            } else {
                topicAttachment.$save();
            }

            $scope.form.files.push(topicAttachment);
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
                        TopicAttachment.delete({attachmentId: attachment.id, topicId: $scope.topic.id});
                    }
                }, angular.noop);
        };
    }]);
