'use strict';

app.service('sAttachment', ['$http', '$q', '$log', 'cosConfig', 'sLocation', 'TopicAttachment', 'angularLoad', function ($http, $q, $log, cosConfig, sLocation, TopicAttachment, angularLoad) {

    var sAttachment = this;
 /*GOOGLE API*/
    var googlePickerApiLoaded = false;
    var oauthToken;

    var createPicker = function () {
        var pickerCallback = function (data) {
            if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                var doc = data[google.picker.Response.DOCUMENTS][0];
                var attachment = {
                    name: doc[google.picker.Document.NAME],
                    type: doc[google.picker.Document.TYPE],
                    source: TopicAttachment.SOURCES.googledrive,
                    size: doc.sizeBytes || 0,
                    link: doc[google.picker.Document.URL]
                };
                resolve(attachment);
            }
        };
        var picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS)
            .setOAuthToken(oauthToken)
            .setDeveloperKey(cosConfig.storage.googleDrive.developerKey)
            .setCallback(pickerCallback)
            .build();
            picker.setVisible(true);
    }
    sAttachment.googleDriveSelect = function () {
            return angularLoad.loadScript('https://apis.google.com/js/api.js?onload=onApiLoad').then(function() {
                var onAuthApiLoad = function () {
                    window.gapi.auth.authorize(
                    {
                      'client_id': cosConfig.storage.googleDrive.clientId,
                      'scope': ['https://www.googleapis.com/auth/drive.file'],
                      'immediate': false
                    },
                    function (authResult) {
                        if (authResult && !authResult.error && googlePickerApiLoaded) {
                            oauthToken = authResult.access_token;
                            googlePickerApiLoaded = true;
                            createPicker();
                        }
                    });
                };

                var onPickerApiLoad = function () {
                    googlePickerApiLoaded = true;
                }

                gapi.load('client', {'callback': onAuthApiLoad});
                gapi.load('picker', {'callback': onPickerApiLoad});
            })
        .catch(function(e) {
            // There was some error loading the script. Meh
            $log.error(e);
        });
    };

    /*DROPBOX*/
    sAttachment.dropboxSelect = function () {
        Dropbox.appKey = cosConfig.storage.dropbox.appKey;
        return new Promise(function (resolve, reject) {
            return Dropbox.choose({
                success: function(files) {
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
                clientId: cosConfig.storage.oneDrive.clientId,
                action: 'share',
                advanced: {
                    redirectUri: sLocation.getAbsoluteUrl('/onedrive')
                },
                success: function (res) {
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
