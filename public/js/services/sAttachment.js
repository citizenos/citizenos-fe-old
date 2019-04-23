'use strict';

app.service('sAttachment', ['$http', '$q', '$log', 'cosConfig', 'sLocation', 'TopicAttachment', 'angularLoad', function ($http, $q, $log, cosConfig, sLocation, TopicAttachment, angularLoad) {

    var sAttachment = this;
    /*GOOGLE API*/
    var googlePickerApiLoaded = false;
    var oauthToken;

    var createPicker = function () {
        return new Promise (function (resolve) {
            var pickerCallback = function (data) {
                console.log('CALLBACK', data);
                if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                    var doc = data[google.picker.Response.DOCUMENTS][0];
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
            console.log('PICKER', google.picker);
            /*
            var picker = new google.picker.PickerBuilder()
                .addView(google.picker.ViewId.DOCS)
                .setOAuthToken(oauthToken)
                .setDeveloperKey(cosConfig.attachments.googleDrive.developerKey)
                .setCallback(pickerCallback)
                .setOrigin(window.location.protocol + '//' + window.location.host) // Note the setOrigin
                .build();
            picker.setVisible(true);*/

      ///  function createPicker(token) {
       //    if (pickerApiLoaded && token) {
                var picker = new google.picker.PickerBuilder()
                    // Instruct Picker to display only spreadsheets in Drive. For other
                    // views, see https://developers.google.com/picker/docs/#otherviews
                    .addView(google.picker.ViewId.DOCUMENTS)
                    // Hide the navigation panel so that Picker fills more of the dialog.
                    .enableFeature(google.picker.Feature.NAV_HIDDEN)
                    // Hide the title bar since an Apps Script dialog already has a title.
                    .hideTitleBar()
                    .setOAuthToken(oauthToken)
                    .setDeveloperKey(cosConfig.attachments.googleDrive.developerKey)
                    .setCallback(pickerCallback)
                    .setOrigin(window.location.protocol + '//' + window.location.host)
                    // Instruct Picker to fill the dialog, minus 2 pixels for the border.
                    .setSize(600, 400)
                    .build();
                picker.setVisible(true);
   //         }
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
