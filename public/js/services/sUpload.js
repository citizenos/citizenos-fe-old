'use strict';

app.service('sUpload', ['$http', '$window', 'cosConfig', 'sLocation', function ($http, $window, cosConfig, sLocation) {

    var sUpload = this;

    sUpload.ALLOWED_FILE_TYPES = cosConfig.attachments.upload.allowedFileTypes;

    sUpload.upload = function (file, folder) {
        var path = sLocation.getAbsoluteUrlApi('/api/users/self/upload');

        var formData = new FormData();
        if (folder) {
            formData.append('folder', folder);
        }
        formData.append('file', file);

        return $http({
            url: path,
            method: 'POST',
            data: formData,
            headers: {'Content-Type': undefined}
        }).then(function (result) {
            return result.data;
        });
    };

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
