'use strict';

app.service('sAttachment', ['$http', '$q', '$log', 'cosConfig', 'sLocation', 'TopicAttachment', 'angularLoad', function ($http, $q, $log, cosConfig, sLocation, TopicAttachment, angularLoad) {

    var sAttachment = this;
    /*GOOGLE API*/
    var googlePickerApiLoaded = false;
    var oauthToken;

    var createPicker = function () {
        return new Promise (function (resolve) {
            var pickerCallback = function (data) {
                if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                    console.log('DATA', data);
                    var doc = data[google.picker.Response.DOCUMENTS][0];
                    console.log('DOC', doc)
                    var attachment = {
                        name: doc[google.picker.Document.NAME],
                        type: doc[google.picker.Document.TYPE],
                        source: TopicAttachment.SOURCES.googledrive,
                        size: doc.sizeBytes || 0,
                        link: doc[google.picker.Document.URL]
                    };
                    return resolve(attachment);
                }
            };
            var picker = new google.picker.PickerBuilder()
                .addView(google.picker.ViewId.DOCS)
                .setOAuthToken(oauthToken)
                .setDeveloperKey(cosConfig.attachments.googleDrive.developerKey)
                .setCallback(pickerCallback)
                .setOrigin(window.location.protocol + '//' + window.location.host)
                .setSize(600, 400)
                .build();
            picker.setVisible(true);
        });
    }
    sAttachment.googleDriveSelect = function () {
        return new Promise(function (resolve) {
            //return angularLoad.loadScript('https://apis.google.com/js/api.js?onload=onApiLoad').then(function() {
                var onAuthApiLoad = function () {
                    window.gapi.auth.authorize(
                    {
                      'client_id': cosConfig.attachments.googleDrive.clientId,
                      'scope': ['https://www.googleapis.com/auth/drive.file'],
                      'immediate': false
                    },
                    function (authResult) {
                        if (authResult && !authResult.error && googlePickerApiLoaded) {
                            oauthToken = authResult.access_token;
                            googlePickerApiLoaded = true;
                            return resolve(createPicker());
                        }
                        return resolve();
                    });
                };

                var onPickerApiLoad = function () {
                    googlePickerApiLoaded = true;
                }

                gapi.load('client', {'callback': onAuthApiLoad});
                gapi.load('picker', {'callback': onPickerApiLoad});
         //   })
        })
        .catch(function(e) {
            $log.error(e);
        });
    };

    /*DROPBOX*/
    sAttachment.dropboxSelect = function () {
        Dropbox.appKey = cosConfig.attachments.dropbox.appKey;
        return new Promise(function (resolve, reject) {
            return Dropbox.choose({
                success: function(files) {
                    console.log('DROPBOX', files);
                    var attachment = {
                        name: files[0].name,
                        type: files[0].name.split('.').pop(),
                        source: TopicAttachment.SOURCES.dropbox,
                        size: files[0].bytes,
                        link: files[0].link
                    };
                    return resolve(attachment);
                },
                cancel: function() {
                    reject();
                },
                linkType: 'preview',
                multiselect: false
            });
        });
    };

    /* ONEDRIVE */

    sAttachment.oneDriveSelect = function () {
        return new Promise(function (resolve, reject) {
                OneDrive.open({
                clientId: cosConfig.attachments.oneDrive.clientId,
                action: 'share',
                advanced: {
                    redirectUri: sLocation.getAbsoluteUrl('/onedrive')
                },
                success: function (res) {
                    console.log('ONEDRIVE', res);
                    var attachment = {
                        name: res.value[0].name,
                        type: res.value[0].name.split('.').pop(),
                        source: TopicAttachment.SOURCES.onedrive,
                        size: res.value[0].size,
                        link: res.value[0].permissions[0].link.webUrl
                    };
                    resolve(attachment);
                },
                cancel: function () {},
                error: function (err) {
                    $log.error(err);
                }
            });
        });
    };

}]);
