'use strict';

app.service('sUpload', ['$http', '$window', 'cosConfig', 'sLocation', function ($http, $window, cosConfig, sLocation) {

    var sUpload = this;

    sUpload.ALLOWED_FILE_TYPES = cosConfig.attachments.upload.allowedFileTypes;

    var upload = function (path, file, data) {
        var formData = new FormData();
        formData.append('file', file);
        if (data) {
            angular.forEach(data, function (value, key) {
                formData.append(key, value);
            });
        }

        return $http({
            url: path,
            method: 'POST',
            data: formData,
            headers: {'Content-Type': undefined}
        }).then(function (result) {
            return result.data;
        });
    };

    sUpload.uploadUserImage = function (file) {
        var path = sLocation.getAbsoluteUrlApi('/api/users/self/upload');

        return upload(path, file);
    };

    sUpload.topicAttachment = function (topicId, attachment) {
        var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/attachments/upload');
        path = path.replace(':topicId', topicId);

        return upload(path, attachment.file, attachment);
    }
    sUpload.download = function (topicId, attachmentId, userId) {
        var path = sLocation.getAbsoluteUrlApi('/api/topics/:topicId/attachments/:attachmentId');

        if (userId) {
            path = sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/attachments/:attachmentId')
        }
        path = path.replace(':topicId', topicId)
            .replace(':attachmentId', attachmentId);

        $window.location.href = path + '?download=true';
    };

}]);
