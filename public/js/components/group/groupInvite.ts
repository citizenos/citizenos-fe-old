'use strict';
import * as angular from 'angular';
import { sortedUniq, find } from 'lodash';
import { isEmail } from 'validator';
import * as $ from 'jquery';

let groupSettings = {
    selector: 'groupInvite',
    templateUrl: '/views/components/group/group_invite.html',
    bindings: {
    },
    controller: ['$stateParams', '$log', 'ngDialog', 'sAuth', 'sSearch', 'sLocation', 'sNotification', 'Group', 'GroupMemberUser', 'GroupInviteUser', 'GroupInviteUserService', 'GroupJoin', 'AppService', class GroupInviteController {
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
            joinUrl: null
        };

        public memberGroups = ['users', 'emails'];

        public maxUsers = 550;
        public itemsPerPage = 10;
        private EMAIL_SEPARATOR_REGEXP = /[;,\s]/ig;

        public membersPage = 1;
        public members = [];
        public invalid = [];
        public inviteMessageMaxLength = 1000;

        public searchStringUser = null;
        public searchResults = {
            users: []
        };
        public groupLevel;
        public group;
        public errors = null;

        public tabs = [
            {
                id: 'users',
                name: 'INVITE_USERS'
            },
            {
                id: 'share',
                name: 'SHARE'
            }
        ];
        public tabSelected = 'users';

        constructor(private $stateParams, private $log, private ngDialog, private sAuth, private sSearch, private sLocation, private sNotification, private Group, private GroupMemberUser, private GroupInviteUser, private GroupInviteUserService, private GroupJoin, private app) {
            Group.get(this.$stateParams.groupId)
                .then((group) => {
                    this.group = group;
                    // Create a copy of parent scopes Group, so that while modifying we don't change parent state
                    this.group = angular.copy(this.group);

                    if (this.group.join) {
                        this.form.join = this.group.join;
                    }
                    if (this.form.join) {
                        this.generateJoinUrl();
                    }

                    this.groupLevel = this.GroupMemberUser.LEVELS.read;
                });
        }

        search(str) {
            if (str && str.length >= 2) {
                this.searchStringUser = str;
                this.sSearch
                    .searchUsers(str)
                    .then((response) => {
                        this.searchResults = angular.merge({}, { users: [], topics: [] });
                        response.data.data.results.public.users.rows.forEach((user) => {
                            this.searchResults.users.push(user);
                        });
                    });
            } else {
                this.searchResults = angular.merge({}, { users: [], topics: [] });
            }
        };

        itemsExist(type) {
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

        isInGroup(item, group) {
            if (group === 'emails') {
                return item.userId === item.name;
            } else {
                return item.userId !== item.name;
            }
        };

        removeAllMembers() {
            this.members = []
        };

        updateGroupLevel(level) {
            this.groupLevel = level;
            this.members.forEach((item) => {
                item.level = level;
            });
        };

        loadPage(pageNr) {
            this.membersPage = pageNr;
        };

        totalPages(items) {
            return Math.ceil(items.length / this.itemsPerPage);
        };

        isOnPage(index, page) {
            const endIndex = page * this.itemsPerPage;
            return (index >= (endIndex - this.itemsPerPage) && index < endIndex);
        };

        orderMembers() {
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

        addGroupMemberUser(member?) {
            if (member) {
                if (find(this.members['users'], { userId: member.id })) {
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

        doRemoveMemberUser(member) {
            this.members.splice(this.members.indexOf(member), 1);
        };

        updateGroupMemberUserLevel(member, level) {
            this.members[this.members.indexOf(member)].level = level;
        };

        removeInvalidEmail(key) {
            this.invalid.splice(key, 1);
        };

        addCorrectedEmail(email, key) {
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

        doSaveGroup() {
            this.errors = null;
            const savePromises = [];
            // Users
            const groupMemberUsersToInvite = [];
            this.members.forEach((member) => {
                groupMemberUsersToInvite.push({
                    userId: member.userId || member.id,
                    level: member.level,
                    inviteMessage: this.form.inviteMessage
                })
            });

            if (groupMemberUsersToInvite.length) {
                savePromises.push(
                    this.GroupInviteUser.save({ groupId: this.group.id }, groupMemberUsersToInvite)
                );
            }

            return Promise.all(savePromises)
                .then(() => {
                    this.GroupInviteUserService.reload();
                    const dialogs = this.ngDialog.getOpenDialogs();
                    this.ngDialog.close(dialogs[0], '$closeButton');
                }), ((errorResponse) => {
                    if (errorResponse.data && errorResponse.data.errors) {
                        this.errors = errorResponse.data.errors;
                        this.app.tabSelected = this.tabSelected;
                    }
                });
        };

        generateTokenJoin() {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_join_link_generate_confirm.html', //FIXME! GROUP SPECIFIC
                })
                .then(() => {
                    this.GroupJoin.save({
                        groupId: this.group.id,
                        userId: this.sAuth.user.id,
                        level: this.form.join.level
                    })
                        .then((res) => {
                            this.group.join = res;
                            this.form.join.token = res.token;
                            this.form.join.level = res.level;
                            this.generateJoinUrl();
                        });
                }, angular.noop);
        };

        doUpdateJoinToken(level) {
            const groupJoin = {
                groupId: this.group.id,
                userId: this.sAuth.user.id,
                level: level,
                token: this.form.join.token
            };

            this.GroupJoin.update(groupJoin)
                .then((res) => {
                    this.form.join.level = level;
                });
        };

        copyInviteLink() {
            const urlInputElement = document.getElementById('url_invite_group_input') as HTMLInputElement || null;
            urlInputElement.focus();
            urlInputElement.select();
            urlInputElement.setSelectionRange(0, 99999);
            document.execCommand('copy');
        };

        generateJoinUrl() {
            if (this.form.join.token && this.Group.canShare(this.group)) {
                this.form.joinUrl = this.sLocation.getAbsoluteUrl('/groups/join/' + this.form.join.token);
            }
        };

        getExpiresAt() {
            const time = new Date();
            time.setDate(time.getDate() + 14);
            return time;
        }
    }]
}
angular
    .module('citizenos')
    .component(groupSettings.selector, groupSettings);
