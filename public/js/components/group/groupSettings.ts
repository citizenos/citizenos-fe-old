'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let groupSettings = {
    selector: 'groupSettings',
    templateUrl: '/views/components/group/group_settings.html',
    bindings: {
    },
    controller: ['$stateParams', '$document','ngDialog', 'sUpload', 'Group', 'GroupInviteUserService', 'AppService', class GroupSettingsController {
        public group;
        public imageFile;
        public tmpImageUrl;
        public errors = null;
        public sectionsVisible = ['name', 'description', 'image', 'leave'];

        constructor (private $stateParams, private $document,  private ngDialog, private sUpload, private Group, private GroupInviteUserService, private app) {
            Group.get(this.$stateParams.groupId)
                .then((group) => {
                    this.group = group;
                    // Create a copy of parent scopes Group, so that while modifying we don't change parent state
                    this.group = angular.copy(this.group);
                });
        }

        isVisible (section) {
            return this.sectionsVisible.indexOf(section) > -1;
        };

        uploadImage () {
            const input = $(this.$document[0].getElementById('group_image_upload')).find('input');
            input.click();

            input.on('change', (e) => {
                const files = e.target['files'];
                const reader = new FileReader();
                reader.onload = (() => {
                    return (e) => {
                        this.tmpImageUrl = e.target.result;
                    };
                })();
                reader.readAsDataURL(files[0]);
                this.imageFile = files[0];
            });
        };

        deleteGroupImage () {
            this.group.imageUrl = this.tmpImageUrl = null;
            this.imageFile = null;
        };

        doSaveGroup () {
            this.errors = null;

            this.Group.update(this.group)
                .then((data) => {
                    if (this.imageFile) {
                        this.sUpload
                            .uploadGroupImage(this.imageFile, this.group.id)
                            .then((response) => {
                                this.group.imageUrl = response.data.link;
                            }, (err) => {
                                this.errors = err;
                            });

                    }

                    angular.extend(this.group, data);
                })
                .then(() =>  {
                    this.GroupInviteUserService.reload();
                    const dialogs = this.ngDialog.getOpenDialogs();
                    this.ngDialog.close(dialogs[0], '$closeButton');
                }),((errorResponse) => {
                    if (errorResponse.data && errorResponse.data.errors) {
                        this.errors = errorResponse.data.errors;
                    }
                });
        };
    }]
}
angular
    .module('citizenos')
    .component(groupSettings.selector, groupSettings);
