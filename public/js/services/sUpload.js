'use strict';

app.service('sUpload', ['$http', '$q', 'sLocation', function ($http, $q, sLocation) {

    var sUpload = this;

    sUpload.ALLOWED_FILE_TYPES = ['txt', 'pdf', 'doc', 'docx', 'ddoc', 'bdoc', 'odf', 'odt', 'jpg', 'jpeg', 'img', 'png', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx', 'pps', 'xlt'];

    sUpload.getSignedRequest = function (file, folder) {
        var path = sLocation.getAbsoluteUrlApi('/api/users/self/upload/sign');
        return $http.get(path, {params: {filename: file.name, filetype: file.type, folder: folder}});
    };

    sUpload.getSignedDownload = function (uploadLink, name, type) {
        var urlParts = uploadLink.split('/');
        filename = urlParts.pop();
        folder = urlParts.pop();
        filename = filename.split('#')[0].split('?')[0];
        var path = sLocation.getAbsoluteUrlApi('/api/upload/signdownload');
        return $http.get(path, {params: {filename: filename, folder: folder, downloadName: name, filetype: type}});
    };

    sUpload.doUploadFile = function (file, signedRequest, url) {
        return $http({
                    method: 'PUT',
                    url: signedRequest,
                    data: file,
                    headers: {
                        'Content-Type': undefined
                    },
                    transformRequest : function (data, headersGetter) {
                        return data;
                    }
                });
    };

    sUpload.upload = function (file, folder) {
        var fileUrl = null;
        var path = sLocation.getAbsoluteUrlApi('/api/users/self/upload');

        var fd=new FormData();
  //      angular.forEach($scope.files,function(file){
        fd.append('file', file);
    //    });
       return $http.post(path, fd, {
        withCredentials:true
       }).success(function(d)
                {
                    console.log(d);
                    return d;
                })


        /*return sUpload.getSignedRequest(file, folder)
            .then(function (result) {
                var data = result.data.data;
                fileUrl = data.url;
                return sUpload.doUploadFile(file, data.signedRequest, fileUrl)
                    .then(function () {
                        return fileUrl;
                    })
            });*/
    };

    sUpload.delete = function(filepath, folder) {
        var path = sLocation.getAbsoluteUrlApi('/api/users/self/upload');
        var filename = filepath.split('/').pop();
        return  $http.delete(path, {params: {filename: filename, folder: folder}});
    };

}]);
