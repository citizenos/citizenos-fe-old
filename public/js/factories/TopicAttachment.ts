import * as angular from 'angular';
import {isObject} from 'lodash';
declare var google: any;
declare var gapi: any;
declare var Dropbox: any;
declare var OneDrive: any;
export class TopicAttachment {
    private SOURCES = {
        upload: 'upload',
        dropbox: 'dropbox',
        onedrive: 'onedrive',
        googledrive: 'googledrive'
    };

    getUrlPrefix () {
        var prefix = this.sAuth.getUrlPrefix();
        if (!prefix) {
            return '';
        }

        return `/${prefix}`;
    };

    getUrlUser () {
        var userId = this.sAuth.getUrlUserId();
        if (!userId) {
            return '';
        }

        return `/${userId}`;
    };

    constructor(private $http, private $log, private sAuth, private sLocation, private cosConfig) {}

    query(params: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/attachments', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());
        return this.$http.get(path, params).then((res) => {
            return res.data.data;
        });
    }

    get(params?: any) {
        if (!params.attachmentId) params.attachmentId = params.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/attachments/:attachmentId', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, params)
            .then((res) => {
                return res.data.data
            });
    }

    save(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/attachments', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    update(data: any) {
        const requestObject = {};
        Object.keys(data).forEach(function (key) { // Remove all object properties as we have none we care about in the server side
            if (!isObject(data[key])) {
                requestObject[key] = data[key];
            }
        });
        if (!data.attachmentId) data.attachmentId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/attachments/:attachmentId', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

            return this.$http.put(path, requestObject)
            .then((res) => {
                return res.data.data
            });
    }

    delete(data: any) {
        if (!data.attachmentId) data.attachmentId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/attachments/:attachmentId', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.delete(path).then((res) => {
            return res.data;
        });
    }

    googleDriveSelect () {

        let googlePickerApiLoaded = false;
        let oauthToken;
        const createPicker = () => {
            return new Promise ((resolve) => {
                const pickerCallback = (data) => {
                    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                        const doc = data[google.picker.Response.DOCUMENTS][0];
                        const attachment = {
                            name: doc[google.picker.Document.NAME],
                            type: doc[google.picker.Document.TYPE],
                            source: this.SOURCES.googledrive,
                            size: doc.sizeBytes || 0,
                            link: doc[google.picker.Document.URL]
                        };
                        return resolve(attachment);
                    }
                };
                var picker = new google.picker.PickerBuilder()
                    .addView(google.picker.ViewId.DOCS)
                    .setOAuthToken(oauthToken)
                    .setDeveloperKey(this.cosConfig.attachments.googleDrive.developerKey)
                    .setCallback(pickerCallback)
                    .setOrigin(window.location.protocol + '//' + window.location.host)
                    .setSize(600, 400)
                    .build();
                picker.setVisible(true);
            });
        }
        return new Promise((resolve) => {
            const onAuthApiLoad = () => {
                gapi.auth.authorize(
                {
                    'client_id': this.cosConfig.attachments.googleDrive.clientId,
                    'scope': ['https://www.googleapis.com/auth/drive.file'],
                    'immediate': false
                }, (authResult) => {
                    if (authResult && !authResult.error && googlePickerApiLoaded) {
                        oauthToken = authResult.access_token;
                        googlePickerApiLoaded = true;
                        return resolve(createPicker());
                    }
                    return resolve(null);
                });
            };

            const onPickerApiLoad = () => {
                googlePickerApiLoaded = true;
            }

            gapi.load('client', {'callback': onAuthApiLoad});
            gapi.load('picker', {'callback': onPickerApiLoad});
        })
        .catch((e) => {
            this.$log.error(e);
        });
    };

    /*DROPBOX*/
    dropboxSelect () {
        Dropbox.appKey = this.cosConfig.attachments.dropbox.appKey;
        return new Promise((resolve, reject) => {
            return Dropbox.choose({
                success: (files) => {
                    const attachment = {
                        name: files[0].name,
                        type: files[0].name.split('.').pop(),
                        source: this.SOURCES.dropbox,
                        size: files[0].bytes,
                        link: files[0].link
                    };
                    return resolve(attachment);
                },
                cancel: () => {
                    reject();
                },
                linkType: 'preview',
                multiselect: false
            });
        });
    };

    /* ONEDRIVE */

    oneDriveSelect () {
        return new Promise((resolve, reject) => {
                OneDrive.open({
                clientId: this.cosConfig.attachments.oneDrive.clientId,
                action: 'share',
                advanced: {
                    redirectUri: this.sLocation.getAbsoluteUrl('/onedrive')
                },
                success: (res) => {
                    const attachment = {
                        name: res.value[0].name,
                        type: res.value[0].name.split('.').pop(),
                        source: this.SOURCES.onedrive,
                        size: res.value[0].size,
                        link: res.value[0].permissions[0].link.webUrl
                    };
                    resolve(attachment);
                },
                cancel: () => {},
                error: (err) => {
                    this.$log.error(err);
                }
            });
        });
    };
}

angular
    .module('citizenos')
    .service('TopicAttachment', ['$http', '$log', 'sAuth', 'sLocation', 'cosConfig', TopicAttachment]);
