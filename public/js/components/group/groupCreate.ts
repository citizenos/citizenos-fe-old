'use strict';
import * as angular from 'angular';
import {sortedUniq, find} from 'lodash';
import {isEmail} from 'validator';
import * as $ from 'jquery';

let groupCreate = {
    selector: 'groupCreate',
    templateUrl: '/views/modals/group_create_settings.html',
    bindings: {
        visibility: '@?'
    },
    controller: ['$state', '$scope', '$stateParams', '$document', '$log', 'ngDialog', 'sAuth', 'sSearch', 'sUpload', 'sLocation', 'sNotification', 'Group', 'GroupMemberUser', 'GroupMemberTopic', 'GroupInviteUser', 'GroupJoin', 'GroupService', 'AppService', class GroupCreateController {
        public app;
        private visibility = null;
        public levels = {
            none: 0,
            read: 1,
            edit: 2,
            admin: 3
        };

        public form = {
            inviteMessage: null,
            join: {
                level: null,
                token: null
            },
            joinUrl: null,
            newMemberTopicTitle: null,
            newMemberTopicLevel: null
        };

        public memberGroups = ['users', 'emails'];

        public topicList = {
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };

        public maxUsers = 550;
        public itemsPerPage = 10;
        private EMAIL_SEPARATOR_REGEXP = /[;,\s]/ig;

        public membersPage = 1;
        public memberTopics = [];
        public members = [];
        public invalid = [];
        public inviteMessageMaxLength = 1000;

        public searchStringUser = null;
        public searchStringTopic = null;
        public searchResults = {
            topics: [],
            users: []
        };
        public groupLevel;
        public group;
        public imageFile;
        public errors = null;
        public sectionsVisible = ['name', 'description', 'image', 'visibility'];
        public tabs = [
            {
                id: 'settings',
                name: 'SETTINGS'
            },
            {
                id: 'topics',
                name: 'ADD_TOPICS'
            },
            {
                id: 'users',
                name: 'INVITE_USERS'
            },
            {
                id: 'share',
                name: 'SHARE'
            }
        ];
        constructor (private $state, $scope, $stateParams, private $document, private $log, private ngDialog, private sAuth, private sSearch, private sUpload, private sLocation, private sNotification, private Group, private GroupMemberUser, private GroupMemberTopic, private GroupInviteUser, private GroupJoin, private GroupService, AppService) {
            $log.debug('GroupCreateSettingsCtrl', $state, $stateParams);
            this.app = AppService;
            this.app.tabSelected = $stateParams.tab || 'settings';
            this.init();
            $scope.$watch(() => this.visibility, (newValue) => {
                if (newValue) this.group.visibility = newValue;
            });
        }


        private init () {
            // Group creation
            this.group = {
                name: null,
                description: null,
                visibility: this.visibility || this.Group.VISIBILITY.private,
                permission: {
                    level: this.GroupMemberUser.LEVELS.admin
                }
            };

            this.form.join = this.group.join;
            if (this.form.join) {
                this.generateJoinUrl();
            }
            this.form.newMemberTopicLevel = this.GroupMemberTopic.LEVELS.read;
            this.groupLevel = this.GroupMemberUser.LEVELS.read;
        };

        isVisible (section) {
            return this.sectionsVisible.indexOf(section) > -1;
        };

        search (str, type) {
            if (str && str.length >= 2) {
                let include = null;
                if (type === 'topic') {
                    include = 'my.topic';
                    this.sSearch
                        .search(str, {
                            include: include,
                            'my.topic.level': 'admin'
                        })
                        .then((response) => {
                            this.searchResults = angular.merge({}, {users: [], topics: []});
                            response.data.data.results.my.topics.rows.forEach((topic) => {
                                this.searchResults.topics.push(topic);
                            });
                        });
                } else if (type === 'user') {
                    this.searchStringUser = str;
                    this.sSearch
                        .searchUsers(str)
                        .then((response) => {
                            this.searchResults = angular.merge({}, {users: [], topics: []});
                            response.data.data.results.public.users.rows.forEach((user) => {
                                this.searchResults.users.push(user);
                            });
                        });
                }

            } else {
                this.searchResults = angular.merge({}, {users: [], topics: []});
            }
        };

        addGroupMemberTopic (topic) {
            this.searchStringTopic = null;
            this.searchResults.topics = [];

            if (!topic || !topic.id || !topic.title) {
                return false;
            }
            const member = this.memberTopics.find((o) => {
                return o.id === topic.id;
            });

            if (!member) {
                topic.permission.level = this.GroupMemberTopic.LEVELS.read;
                this.memberTopics.push(topic);
            }
        };

        addNewGroupMemberTopic () {
            this.$state.go('topics/create', {
                groupId: this.group.id,
                title: this.form.newMemberTopicTitle,
                groupLevel: this.form.newMemberTopicLevel
            });
        };

        removeGroupMemberTopic (topic) {
            this.memberTopics.splice(this.memberTopics.indexOf(topic), 1);
        };

        updateGroupMemberTopicLevel (topic, level) {
            topic.permission.level = level;
        };

        doOrderTopics (property) {
            if (this.topicList.searchOrderBy.property == property) {
                property = '-' + property;
            }
            this.topicList.searchOrderBy.property = property;
        };

        itemsExist (type) {
            let exists = false;
            let i = (this.membersPage * this.itemsPerPage) - this.itemsPerPage;
            for (i; i < this.members.length && i < (this.membersPage * this.itemsPerPage); i++) {
                if (type === 'users') {
                    if (this.members[i].id) {
                        exists = true;
                        break;
                    }
                } else if (this.members[i].userId === this.members[i].name) {
                    exists = true;
                    break;
                }

            }

            return exists;
        };

        isInGroup (item, group) {
            if (group === 'emails') {
                return item.userId === item.name;
            } else {
                return item.userId !== item.name;
            }
        };

        removeAllMembers () {
            this.members = []
        };

        updateGroupLevel (level) {
            this.groupLevel = level;
            this.members.forEach((item) => {
                item.level = level;
            });
        };

        loadPage (pageNr) {
            this.membersPage = pageNr;
        };

        totalPages (items) {
            return Math.ceil(items.length / this.itemsPerPage);
        };

        isOnPage (index, page) {
            const endIndex = page * this.itemsPerPage;
            return (index >= (endIndex - this.itemsPerPage) && index < endIndex);
        };

        orderMembers () {
            const compare = (a, b) => {
                const property = 'name';
                return (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            };
            const users = this.members.filter((member) => {
                return !!member.id;
            }).sort(compare);
            const emails = this.members.filter((member) => {
                return member.userId === member.name;
            }).sort(compare);

            this.members = users.concat(emails);
        };

        addGroupMemberUser (member?) {
            if (member) {
                if (find(this.members['users'], {userId: member.id})) {
                    // Ignore duplicates
                    this.searchStringUser = null;
                    return this.searchResults.users = [];
                } else {
                    const memberClone = angular.copy(member);
                    memberClone.userId = member.userId;
                    memberClone.level = this.groupLevel;

                    this.members.push(memberClone);
                    this.searchResults.users = [];

                    this.orderMembers();
                }
            } else {
                if (!this.searchStringUser) return;

                // Assume e-mail was entered.
                const emails = this.searchStringUser.replace(this.EMAIL_SEPARATOR_REGEXP, ',').split(',');

                const filtered = emails.filter((email) => {
                    return isEmail(email.trim())
                });

                const invalid = emails.filter((email) => {
                    return !isEmail(email.trim()) && email.trim().length > 0;
                });

                if (filtered.length) {
                    sortedUniq(filtered.sort()).forEach((email) => {
                        email = email.trim();
                        if (this.members.length >= this.maxUsers) {
                            return this.sNotification.addError('MSG_ERROR_INVITE_MEMBER_COUNT_OVER_LIMIT');
                        }
                        if (!find(this.members, ['userId', email])) {
                            this.members.push({
                                userId: email,
                                name: email,
                                level: this.groupLevel
                            });
                            this.orderMembers();
                        }
                    });
                }

                if (invalid && invalid.length) {
                    invalid.forEach((item) => {
                        if (this.invalid.indexOf(item) === -1) {
                            this.invalid.push(item);
                        }
                    });
                }

                this.searchStringUser = null;
            }
        };

        doRemoveMemberUser (member) {
            this.members.splice(this.members.indexOf(member), 1);
        };

        updateGroupMemberUserLevel (member, level) {
            this.members[this.members.indexOf(member)].level = level;
        };

        removeInvalidEmail (key) {
            this.invalid.splice(key, 1);
        };

        addCorrectedEmail (email, key) {
            this.$log.debug('addCorrectedEmail', email, key);

            if (isEmail(email.trim())) {
                if (!find(this.members, ['userId', email])) {
                    this.members.push({
                        userId: email,
                        name: email,
                        level: this.groupLevel
                    });
                }
                this.invalid.splice(key, 1);
            }
        };

        uploadImage () {
            const input = $(this.$document[0].getElementById('group_image_upload')).find('input');
            input.click();

            input.on('change', (e) => {
                const files = e.target['files'];
                const reader = new FileReader();
                reader.onload = (() => {
                    return (e) => {
                        this.group.tmpImageUrl = e.target.result;
                    };
                })();
                reader.readAsDataURL(files[0]);
            });
        };

        deleteGroupImage () {
            this.group.imageUrl = null;
        };

        doSaveGroup () {
            this.errors = null;

            this.Group.save(this.group)
                .then((data) => {
                    angular.extend(this.group, data);
                    if (this.imageFile) {
                        this.sUpload
                            .uploadGroupImage(this.imageFile[0], this.group.id)
                            .then((response) => {
                                this.group.imageUrl = response.data.link;
                            }, (err) => {
                                this.errors = err;
                            });

                    }
                    const savePromises = [];
                    // Users
                    const groupMemberUsersToInvite = [];
                    this.members.forEach((member) => {
                        groupMemberUsersToInvite.push({
                            userId: member.userId,
                            level: member.level,
                            inviteMessage: this.form.inviteMessage
                        })
                    });

                    if (groupMemberUsersToInvite.length) {
                        savePromises.push(
                            this.GroupInviteUser.save({groupId: this.group.id}, groupMemberUsersToInvite)
                        );
                    }

                    // Topics
                    // TODO: Once there is POST /groups/:groupId/members/topics use that
                    this.memberTopics.forEach((topic) => {
                        const member = {
                            groupId: this.group.id,
                            id: topic.id,
                            level: topic.permission.level
                        };
                        const groupMemberTopic = new this.GroupMemberTopic(member);
                        savePromises.push(
                            groupMemberTopic.$save()
                        )
                    });

                    return Promise.all(savePromises)
                })
                .then(() =>  {
                    this.GroupService.reload();
                    this.$state.go('my/groups/groupId', {
                        groupId: this.group.id
                    }, {reload: true});
                },(errorResponse) => {
                    if (errorResponse.data && errorResponse.data.errors) {
                        this.errors = errorResponse.data.errors;
                        this.app.tabSelected = 'settings';
                    }
                });
        };

        generateTokenJoin () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_join_link_generate_confirm.html', //FIXME! GROUP SPECIFIC
                })
                .then(() => {
                    const groupJoin = new this.GroupJoin({
                        groupId: this.group.id,
                        userId: this.sAuth.user.id,
                        level: this.form.join.level
                    });

                    groupJoin.$save()
                        .then((res) => {
                            this.group.join = res;
                            this.form.join.token = res.token;
                            this.form.join.level = res.level;
                            this.generateJoinUrl();
                        });
                }, angular.noop);
        };

        doUpdateJoinToken (level) {
            const groupJoin = new this.GroupJoin({
                groupId: this.group.id,
                userId: this.sAuth.user.id,
                level: level,
                token: this.form.join.token
            });

            groupJoin.$update()
                .then(function (res) {
                    this.form.join.level = level;
                });
        };

        copyInviteLink () {
            const urlInputElement = document.getElementById('url_invite_group_input') as HTMLInputElement || null;
            urlInputElement.focus();
            urlInputElement.select();
            urlInputElement.setSelectionRange(0, 99999);
            document.execCommand('copy');
        };

        generateJoinUrl () {
            if (this.form.join.token && this.group.canUpdate()) {
                this.form.joinUrl = this.sLocation.getAbsoluteUrl('/groups/join/' + this.form.join.token);
            }
        };

        public canUpdate () {
            return true;
        };

        public canDelete () {
            return this.canUpdate();
        };

    }]
}
angular
    .module('citizenos')
    .component(groupCreate.selector, groupCreate);
