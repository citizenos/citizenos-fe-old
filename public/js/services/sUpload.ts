'use strict';
import * as angular from 'angular';

export class Upload {
    private ALLOWED_FILE_TYPES;
    constructor (private $http, private $window, cosConfig, private sLocation) {
        this.ALLOWED_FILE_TYPES = cosConfig.attachments.upload.allowedFileTypes
    }

    upload (path, file, data) {
        const formData = new FormData();
        formData.append('file', file);
        if (data) {
            angular.forEach(data, (value, key) => {
                formData.append(key, value);
            });
        }

        return this.$http({
            url: path,
            method: 'POST',
            data: formData,
            headers: {'Content-Type': undefined}
        }).then((result) => {
            console.log('result', result)
            return result.data;
        }, (err) => {
            console.log('ERROR',err);
        });
    };

    uploadUserImage (file) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/upload');

        return this.upload(path, file, false);
    };

    uploadGroupImage (file, groupId) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/upload')
            .replace(':groupId', groupId);

        return this.upload(path, file, false);
    };;

    topicAttachment (topicId, attachment) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/attachments/upload')
            .replace(':topicId', topicId);

        return this.upload(path, attachment.file, attachment);
    }

    download (topicId, attachmentId, userId) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/topics/:topicId/attachments/:attachmentId');

        if (userId) {
            path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/attachments/:attachmentId');
        }

        path = path.replace(':topicId', topicId).replace(':attachmentId', attachmentId);

        this.$window.location.href = path + '?download=true';
    };
};

angular
    .module('citizenos')
    .service('sUpload', ['$http', '$window', 'cosConfig', 'sLocation', Upload]);
