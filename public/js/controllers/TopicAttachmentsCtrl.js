'use strict';

angular
    .module('citizenos')
    .controller('TopicAttachmentsCtrl', ['$scope', '$state', '$stateParams', '$log', '$document', 'Topic', 'sNotification', 'sUpload', 'sAttachment', 'TopicAttachment', 'ngDialog', function ($scope, $state, $stateParams, $log, $document, Topic, sNotification, sUpload, sAttachment, TopicAttachment, ngDialog) {
        $log.debug('TopicAttachmentsCtrl', $state, $stateParams);

        $scope.form = {
            files: []
        }

        var startingAttachments = [];
        $scope.saveInProgress = false;

        $scope.init = function () {
            TopicAttachment
                .query({topicId: $scope.topic.id}).$promise
                .then(function (attachments) {
                    startingAttachments = attachments;
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

            if(attachment.size > 50000000){
                $scope.$apply(function () {
                    sNotification.addError('MSG_ERROR_ATTACHMENT_SIZE_OVER_LIMIT');
                });

            } else if(sUpload.ALLOWED_FILE_TYPES.indexOf(attachment.type) === -1) {
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
            if($scope.form.files.length < TopicAttachment.LIMIT) {
                $scope.$apply(function () {
                    $scope.form.files.push(attachment);
                });
            }
        };

        $scope.doSaveFiles = function () {
            $scope.saveInProgress = true;
            var done = [];
            var savePromises = [];
            $scope.form.files.forEach(function (attachment, key) {
                if(attachment.file) {
                    var savePromise = new Promise(function (resolve, reject) {
                        return sUpload
                            .upload(attachment.file, 'topics')
                            .then(function (fileUrl){
                                attachment.topicId = $scope.topic.id;
                                attachment.link = fileUrl;
                                var topicAttachment = new TopicAttachment(attachment);

                                topicAttachment
                                    .$save()
                                    .then(function () {
                                        return resolve();
                                    }, function (err) {
                                        var keys = Object.keys(err.data.errors);
                                        keys.forEach(function (key) {
                                            sNotification.addError(err.data.errors[key]);
                                        })
                                    });
                            });
                    });
                    savePromises.push(savePromise);
                } else {
                    attachment.topicId = $scope.topic.id;
                    var topicAttachment = new TopicAttachment(attachment);
                    if (topicAttachment.id) {
                        savePromises.push(topicAttachment.$update());
                    } else {
                        savePromises.push(topicAttachment.$save());
                    }
                }
            });

            Promise
                .all(savePromises)
                .then(function() {
                     $state.go('topics.view', {topicId: $scope.topic.id, editMode: null}, {reload: true});
                });
        };

        $scope.deleteAttachment = function (key, attachment) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_attachment_delete_confirm.html'
                })
                .then(function () {
                    $scope.form.files.splice(key, 1);
                    if(attachment.id) {
                        TopicAttachment.delete({attachmentId: attachment.id, topicId: $scope.topic.id});
                    }
                }, angular.noop);
        };
    }]);
