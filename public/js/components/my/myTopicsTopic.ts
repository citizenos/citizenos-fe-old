import * as angular from 'angular';

let myTopicsTopic = {
    selector: 'myTopicsTopic',
    templateUrl: '/views/components/my/my_topics_topicId.html',
    controller: ['$log', '$state', '$stateParams', '$anchorScroll', '$q', 'sAuth', 'Topic', 'TopicVote', 'TopicMemberUser', 'TopicMemberUserService' , 'TopicMemberGroup', 'TopicMemberGroupService', 'TopicInviteUser', 'TopicInviteUserService', 'TopicActivitiesService', 'AppService', 'ngDialog', class MyTopicsTopicController {
        public topic;
        public userList = {
            isVisible: false,
            isSearchVisible: false
        };
        public voteResults = {
            isVisible: false
        };

        public groupList = {
            isVisible: false,
            isSearchVisible: false
        };

        public generalInfo = {
            isVisible: true
        };
        constructor ($log, private $state, private $stateParams, private $anchorScroll, private $q, private sAuth, private Topic, private TopicVote, private TopicMemberUser, private TopicMemberUserService, private TopicMemberGroup, private TopicMemberGroupService, private TopicInviteUser, private TopicInviteUserService, private TopicActivitiesService, private app, private ngDialog) {
            $log.debug('MyTopicsTopicController');
            this.topic = this.app.topic;
            TopicMemberUserService.topicId = $stateParams.topicId;
            TopicInviteUserService.topicId = $stateParams.topicId;
            TopicMemberGroupService.topicId = $stateParams.topicId;
            TopicActivitiesService.topicId = $stateParams.topicId;
            if ($stateParams.openTabs) {
                this.userList.isVisible = false;
                this.groupList.isVisible = false;
                const stateParams = Object.assign({}, $stateParams);
                if (!Array.isArray($stateParams.openTabs)) {
                    stateParams.openTabs = [$stateParams.openTabs];
                }
                stateParams.openTabs.forEach((tab) => {
                    switch (tab) {
                        case 'user_list':
                            this.doShowMemberUserList();
                            break;
                        case 'group_list':
                            this.doShowMemberGroupList();
                            break;
                        case 'activity_feed':
                            this.app.activityFeed = true;
                            break;
                        case 'vote_results':
                            this.voteResults.isVisible = true;
                            break;
                    }
                });
            }

            if ($stateParams.notificationSettings) {
                this.app.doShowTopicNotificationSettings(this.topic.id);
            }
        };

        doShowMemberUserList () {
            this.userList.isVisible = true;
            this.TopicMemberUserService.reload();
            this.TopicInviteUserService.reload();
        };

        toggleTabParam (tabName) {
            return new Promise<void>((resolve) => {
                let tabIndex;
                const stateParams = Object.assign({}, this.$stateParams);
                if (this.$stateParams.openTabs) {
                    tabIndex = this.$stateParams.openTabs.indexOf(tabName);
                }
                if (tabIndex > -1) {
                    if (!Array.isArray(this.$stateParams.openTabs)) {
                        stateParams.openTabs = null;
                    } else if (this.$stateParams.openTabs) {
                        stateParams.openTabs.splice(tabIndex, 1);
                    }
                } else {
                    if (!this.$stateParams.openTabs) {
                        stateParams.openTabs = [];
                    }
                    if (!Array.isArray(this.$stateParams.openTabs) && this.$stateParams.openTabs) {
                        stateParams.openTabs = [this.$stateParams.openTabs];
                    }
                    stateParams.openTabs.push(tabName);
                }
                this.$state.transitionTo(this.$state.current.name, stateParams, {
                    notify: false,
                    reload: false,
                    inherit: true,
                    replace: true
                }).then(() => {
                    return resolve();
                });
            });

        };

        doToggleActivities () {
            this.TopicActivitiesService.reload();
            this.app.activityFeed = !this.app.activityFeed;
        };

        doSaveVoteEndsAt () {
            this.topic.vote.topicId = this.topic.id;
            return this.TopicVote
                .update(this.topic.vote)
                .then(() => {
                    // TODO: Reload from server until GET /:voteId and PUT /:voteId return the same output
                    return this.TopicVote.get({topicId: this.topic.id}).then((vote) => this.topic.vote = vote)
                });
        };

        doToggleMemberUserList () {
            let doShowList = this.userList.isVisible;
            if (this.userList.isVisible) {
                this.userList.isVisible = !this.userList.isVisible;
            }
            this.toggleTabParam('user_list')
                .then(() => {
                    if (!doShowList) {
                        this.doShowMemberUserList()
                        this.checkIfInView('user_list');
                    }
                });
        };

        viewMemberUsers () {
            if (!this.userList.isVisible) {
                this.doShowMemberUserList();
                this.checkIfInView('user_list');
            } else {
                this.checkIfInView('user_list');
            }
        };


        doToggleMemberGroupList () {
            const doShowList = this.groupList.isVisible;
            if (this.groupList.isVisible) {
                this.groupList.isVisible = !this.groupList.isVisible;
            }
            this.toggleTabParam('group_list')
                .then(() => {
                    if (!doShowList) {
                        this.doShowMemberGroupList();
                        this.checkIfInView('group_list');
                    }
                });
        };

        doShowMemberGroupList () {
            this.groupList.isVisible = true;
        };

        viewMemberGroups () {
            if (!this.groupList.isVisible) {
                this.doShowMemberGroupList();
                this.checkIfInView('group_list')
            } else {
                this.checkIfInView('group_list');
            }
        };

        checkIfInView (elemId) {
            const elem = document.getElementById(elemId);
            const bounding = elem.getBoundingClientRect();

            if ((bounding.top + 100) > (window.scrollY + window.innerHeight)) {
                setTimeout(() => {
                    this.app.scrollToAnchor(elemId)
                }, 200);
            }
        };

        goToTopicView () {
            const status = this.topic.status;
            const params = {topicId: this.topic.id};
            if (status === this.Topic.STATUSES.inProgress) {
                this.$state.go('topics/view', params);
            } else if (status === this.Topic.STATUSES.voting) {
                params['voteId'] = this.topic.voteId;
                this.$state.go('topics/view/votes/view', params);
            } else {
                this.$state.go('topics/view/followUp', params);
            }
        };

        doLeaveTopic () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: this.topic
                    }
                })
                .then(() => {
                    this.TopicMemberUser
                        .delete({id: this.app.user.id, topicId: this.topic.id})
                        .then(() => {
                            this.$state.go('my/topics', null, {reload: true});
                        });
                }, (err) => {
                    console.log(err);
                });
        };

        doDeleteTopic () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_confirm.html'
                })
                .then(() => {
                    this.Topic
                        .delete(this.topic)
                        .then(() => {
                            this.$state.go('my/topics', null, {reload: true});
                        });
                }, angular.noop);
        };

        doToggleVoteResults () {
            this.voteResults.isVisible = !this.voteResults.isVisible;
            if (this.voteResults.isVisible) {
                this.checkIfInView('vote_results');
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
                    const promisesToResolve = [];
                    // Delete all
                    if (isAll) {
                        this.TopicInviteUserService.users.forEach((invite) => {
                            if (invite.user.id === topicInviteUser.user.id) {
                                promisesToResolve.push(this.TopicInviteUser.delete(invite));
                            }
                        });
                    } else { // Delete single
                        promisesToResolve.push(this.TopicInviteUser.delete(topicInviteUser));
                    }

                    this.$q
                        .all(promisesToResolve)
                        .then(() => {
                            this.TopicInviteUserService.reload();
                        });
                }, angular.noop);
        };
    }]
};

angular
    .module('citizenos')
    .component(myTopicsTopic.selector, myTopicsTopic);

