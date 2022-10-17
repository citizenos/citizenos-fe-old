'use strict';
import * as angular from 'angular';
import {orderBy, sortedUniqBy} from 'lodash';

let topicMembers = {
    selector: 'topicMembers',
    templateUrl: '/views/modals/topic_members.html',
    bindings: {},
    controller: ['AppService', 'TopicMemberUserService', 'TopicMemberGroupService', 'TopicInviteUserService', '$log', '$q', '$state', '$stateParams', '$filter', '$location', 'ngDialog', 'sAuth', 'TopicMemberUser', 'TopicInviteUser', 'TopicMemberGroup', class TopicMembersController {
        public app;
        private topic;
        constructor (AppService, public TopicMemberUserService, public TopicMemberGroupService, public TopicInviteUserService, private $log, private $q, private $state, private $stateParams, private $filter, private $location, private ngDialog, private sAuth, private TopicMemberUser, private TopicInviteUser, private TopicMemberGroup) {
            this.app = AppService;
            this.topic = AppService.topic;
            this.app.tabSelected = $stateParams.tab || 'participants';
            TopicMemberUserService.topicId = this.topic.id;
            TopicMemberUserService.reload();
            TopicMemberGroupService.topicId = this.topic.id;
            TopicMemberUserService.reload();
            TopicInviteUserService.topicId = this.topic.id;
            TopicMemberUserService.reload();
        }

        doUpdateMemberUser (topicMemberUser, level) {
            if (topicMemberUser.level !== level) {
                const oldLevel = topicMemberUser.level;
                topicMemberUser.level = level;
                topicMemberUser
                    .$update({topicId: this.topic.id})
                    .then(() => {
                        topicMemberUser.levelUser = level;
                    }, () => {
                        topicMemberUser.level = oldLevel;
                    });
            }
        };

        doDeleteMemberUser (topicMemberUser) {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_delete_confirm.html',
                    data: {
                        user: topicMemberUser
                    }
                })
                .then(() => {
                    topicMemberUser
                        .$delete({topicId: this.topic.id})
                        .then(() => {
                            this.TopicMemberUserService.reload();
                        });
                }, angular.noop);
        };

        doUpdateMemberGroup (topicMemberGroup, level) {
            this.$log.debug('doUpdateMemberGroup', topicMemberGroup, level);

            if (topicMemberGroup.level !== level) {
                const oldLevel = topicMemberGroup.level;
                topicMemberGroup.level = level;
                topicMemberGroup
                    .$update({topicId: this.topic.id})
                    .then(() => {
                        this.TopicMemberUserService.reload();
                    },() => {
                        topicMemberGroup.level = oldLevel;
                });
            }
        };

        doDeleteMemberGroup (topicMemberGroup) {
            this.$log.debug('doDeleteMemberGroup', topicMemberGroup);

            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_group_delete_confirm.html',
                    data: {
                        group: topicMemberGroup
                    }
                })
                .then(() => {
                    topicMemberGroup
                        .$delete({topicId: this.topic.id})
                        .then(() => {
                            this.TopicMemberGroupService.reload();
                            this.TopicMemberUserService.reload();
                        });
                }, angular.noop);
        };

        doUpdateInvite (topicInviteUser, level) {
            this.$log.debug('doUpdateMemberGroup', topicInviteUser, level);

            if (topicInviteUser.level !== level) {
                const oldLevel = topicInviteUser.level;
                topicInviteUser.level = level;
                topicInviteUser
                    .$update({topicId: this.topic.id})
                    .then(() => {
                        topicInviteUser.level = level;
                    }, () => {
                        topicInviteUser.level = oldLevel;
                    });
            }
        };

        doDeleteInviteUser (topicInviteUser) {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_invite_user_delete_confirm.html',
                    data: {
                        user: topicInviteUser.user
                    }
                })
                .then((isAll) => {
                    var promisesToResolve = [];
                    // Delete all
                    if (isAll) {
                        this.TopicInviteUserService.users.forEach((invite) => {
                            if (invite.user.id === topicInviteUser.user.id) {
                                promisesToResolve.push(invite.$delete({topicId: this.topic.id}));
                            }
                        });
                    } else { // Delete single
                        promisesToResolve.push(topicInviteUser.$delete({topicId: this.topic.id}));
                    }

                    this.$q
                        .all(promisesToResolve)
                        .then(() => {
                            return this.TopicInviteUserService.reload();
                        });
                }, angular.noop);
        };
    }]
};
angular
    .module('citizenos')
    .component(topicMembers.selector, topicMembers);