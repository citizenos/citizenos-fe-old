'use strict';
import * as angular from 'angular';
import {find, filter, sortedUniq} from 'lodash';
import * as validator from 'validator';

let topicInvite = {
    selector: 'topicInvite',
    templateUrl: '/views/modals/topic_invite.html',
    bindings: {},
    controller: ['$state', '$stateParams', '$log', '$timeout', 'ngDialog', 'sSearch', 'sLocation', 'sNotification', 'sAuth', 'Topic', 'TopicInviteUser', 'TopicMemberUser', 'TopicMemberGroup', 'TopicJoin', 'AppService', class TopicInviteController {
        private EMAIL_SEPARATOR_REGEXP = /[;,\s]/ig;
        public memberGroups = ['groups', 'users'];
        public inviteMessageMaxLength = 1000;
        public app;
        public topic;
        public topicList = {
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };
        public form = {
            topic: null,
            description: null,
            join: {
                level: null,
                token: null
            },
            joinUrl: null,
            inviteMessage: null
        };

        public members = [];
        public invalid = [];
        public searchString = null;
        public searchResults = {users: [], groups: [], emails: [], combined: []};

        public errors = null;
        public groupLevel;
        public membersPage = 1;
        private maxUsers = 50;
        private itemsPerPage = 10;

        constructor (private $state, private $stateParams, private $log, private $timeout, private ngDialog, private sSearch, private sLocation, private sNotification, private sAuth, private Topic, private TopicInviteUser, private TopicMemberUser, private TopicMemberGroup, private TopicJoin, AppService) {
            $log.debug('TopicInviteCtrl', $state, $stateParams);
            this.app = AppService;
            this.app.tabSelected = $stateParams.tab || 'invite';

            this.sNotification = sNotification;
            this.init();
        }
        init () {
            this.topic = this.app.topic;
            this.form.topic = angular.copy(this.topic);
            this.form.description = angular.element(this.topic.description).text().replace(this.topic.title, '');

            this.form.join = this.form.topic.join;
            this.generateJoinUrl();
            this.groupLevel = this.TopicMemberGroup.LEVELS.read;
        };

        search (str) {
            const self = this;
            this.searchString = str; // TODO: Hackish - Typeahead has term="searchString" but somehow the 2 way binding does not work there, investigate when time
            if (str && str.length >= 2) {
                if (str.match(this.EMAIL_SEPARATOR_REGEXP)) {
                    this.searchResults = angular.merge({}, {users: [], groups: [], emails: [], combined: [str]});
                } else {
                    const include = ['my.group'];
                    self.sSearch
                        .search(str, {include: include})
                        .then((groupresponse) => {
                            self.sSearch
                                .searchUsers(str)
                                .then((userrespons) => {
                                    self.searchResults = angular.merge({}, {users: [], groups: [], emails: [], combined: []});
                                    if (userrespons.data.data.results.public.users.rows.length) {
                                        userrespons.data.data.results.public.users.rows.forEach((user) => {
                                            self.searchResults.users.push(user);
                                        });
                                    } else if (validator.isEmail(str)) {
                                        self.searchResults.emails.push(self.searchString);
                                    }
                                    if (groupresponse.data.data.results.my.groups.rows.length) {
                                        groupresponse.data.data.results.my.groups.rows.forEach((group) => {
                                            self.searchResults.groups.push(group);
                                        });
                                    }
                                    self.searchResults.combined = self.searchResults.users.concat(self.searchResults.groups).concat(self.searchResults.emails);
                                });
                        });
                }
            } else {
                self.searchResults = angular.merge({}, {users: [], groups: [], emails: [], combined: []});
            }
        };

        itemsExist (type) {
            let exists = false;
            let i = (this.membersPage * this.itemsPerPage) - this.itemsPerPage;
            for (i; i < this.members.length && i < (this.membersPage * this.itemsPerPage); i++) {
                if (type === 'groups') {
                    if (this.members[i].groupId) {
                        exists = true;
                        break;
                    }
                } else if (!this.members[i].groupId) {
                    exists = true;
                    break;
                }

            }

            return exists;
        };

        isInGroup (item, group) {
            if (group === 'groups') {
                return !!item.groupId;
            } else {
                return !item.groupId;
            }
        };

        updateGroupLevel (level) {
            this.groupLevel = level;
            this.members.forEach((item) => {
                item.level = level;
            });
        };

        removeAllMembers () {
            this.members = [];
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
            const groups = this.members.filter((member) => {
                return !!member.groupId;
            }).sort(compare);
            const users = this.members.filter((member) => {
                return !member.groupId;
            }).sort(compare);

            this.members = groups.concat(users);
        };

        addTopicMember (member) {
            if (this.members.length >= this.maxUsers) {
                this.sNotification.addError('MSG_ERROR_INVITE_MEMBER_COUNT_OVER_LIMIT');
                return;
            }
            if (!member || (typeof member === 'string' && (validator.isEmail(member) || member.match(this.EMAIL_SEPARATOR_REGEXP)))) {
                this.$log.debug('go to addTopicMemberUser');
                return this.addTopicMemberUser();
            }
            if (member.hasOwnProperty('company')) {
                return this.addTopicMemberUser(member);
            } else {
                return this.addTopicMemberGroup(member);
            }
        };

        addTopicMemberGroup (group) {
            this.searchString = null;
            this.searchResults = angular.merge({}, {users: [], groups: [], emails: [], combined: []});

            if (!group || !group.id || !group.name) {
                return false;
            }
            const member = find(this.members, (o) => {
                return o.id === group.id;
            });

            if (!member) {
                const memberClone = angular.copy(group);
                memberClone.groupId = group.id;
                memberClone.level = this.groupLevel;

                this.members.push(memberClone);
                this.orderMembers();
            }
        };

        addCorrectedEmail (email, key) {
            if (validator.isEmail(email.trim())) {
                if (!find(this.members, ['userId', email])) {
                    this.addTopicMemberUser({
                        userId: email,
                        name: email,
                        level: this.groupLevel
                    });
                }
                this.invalid.splice(key, 1);
            }
        };

        removeInvalidEmail (key) {
            this.invalid.splice(key, 1);
        };

        clearSearchResults () {
            this.searchResults = angular.merge({}, {users: [], groups: [], emails: [], combined: []});
        }
        addTopicMemberUser (member?) {
            const self = this;
            if (member) {
                if (find(this.members, {userId: member.id})) {
                    // Ignore duplicates
                    this.searchString = null;
                    this.clearSearchResults();
                    return;
                } else {
                    const memberClone = angular.copy(member);
                    memberClone.userId = member.id;
                    memberClone.level = this.groupLevel;

                    this.members.push(memberClone);
                    this.orderMembers();
                    this.clearSearchResults();
                }
            } else {
                if (!this.searchString) return;

                // Assume e-mail was entered.
                const emails = this.searchString.replace(this.EMAIL_SEPARATOR_REGEXP, ',').split(',');

                const filtered = filter(emails, (email) => {
                    return validator.isEmail(email.trim())
                });

                const invalid = filter(emails, (email) => {
                    return !validator.isEmail(email.trim()) && email.trim().length > 0;
                });

                if (!filtered.length && !invalid.length) {
                    return this.$log.debug('Ignoring member, as it does not look like e-mail', this.searchString);
                }

                sortedUniq(filtered.sort()).forEach((email) => {
                    email = email.trim();
                    if (self.members.length >= this.maxUsers) {
                        return self.sNotification.addError('MSG_ERROR_INVITE_MEMBER_COUNT_OVER_LIMIT');
                    }
                    if (!find(self.members, ['userId', email])) {
                        self.members.push({
                            userId: email,
                            name: email,
                            level: self.groupLevel
                        });
                        self.orderMembers();
                    }
                });

                if (invalid && invalid.length) {
                    invalid.forEach((item) => {
                        if (self.invalid.indexOf(item) === -1) {
                            self.invalid.push(item);
                        }
                    });
                }

                this.clearSearchResults();
                this.searchString = null;
            }
        };

        removeTopicMemberUser (member) {
            this.members.splice(this.members.indexOf(member), 1);
        };

        updateTopicMemberUserLevel (member, level) {
            this.members[this.members.indexOf(member)].level = level;
        };

        removeTopicMemberGroup (group) {
            this.members.splice(this.members.indexOf(group), 1);
        };

        updateTopicMemberGroupLevel (group, level) {
            this.members[this.members.indexOf(group)].level = level;
        };

        doSaveTopic () {
            const self = this;
            this.errors = null;

            if (this.form.topic.endsAt && this.topic.endsAt === this.form.topic.endsAt) { //Remove endsAt field so that topics with endsAt value set could be updated if endsAt is not changed
                delete this.form.topic.endsAt;
            }

            this.form.topic
                .$update()
                .then((data) => {
                    const savePromises = [];
                    // Users
                    const topicMemberUsersToSave = [];
                    self.members.forEach((member) => {
                        if (member.groupId) {
                            member = {
                                id: member.id,
                                topicId: self.topic.id,
                                level: member.level
                            };
                            const topicMemberGroup = new self.TopicMemberGroup(member);
                            savePromises.push(topicMemberGroup.$save());
                        } else {
                            topicMemberUsersToSave.push({
                                userId: member.userId,
                                inviteMessage: self.form.inviteMessage,
                                level: member.level
                            })
                        }
                    });

                    if (topicMemberUsersToSave.length) {
                        savePromises.push(
                            self.TopicInviteUser.save({topicId: self.topic.id}, topicMemberUsersToSave)
                        );
                    }

                    return Promise.all(savePromises)
                })
                .then(() => {
                    self.$timeout(() => { // Avoid $digest already in progress
                            const dialogs = self.ngDialog.getOpenDialogs();
                            self.ngDialog.close(dialogs[0], '$closeButton');
                            self.$state.go(self.$state.current.parent, {topicId: self.topic.id}, {reload: true});
                        });
                    },
                    (errorResponse) => {
                        if (errorResponse.data && errorResponse.data.errors) {
                            self.errors = errorResponse.data.errors;
                        }
                    }
                );
        };

        generateTokenJoin () {
            const self = this;
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_join_link_generate_confirm.html',
                })
                .then(() => {
                    const topicJoin = new self.TopicJoin({
                        topicId: self.topic.id,
                        userId: self.sAuth.user.id,
                        level: self.form.join.level
                    });

                    topicJoin
                        .$save()
                        .then((res) => {
                            self.topic.join = res;
                            self.form.join.token = res.token;
                            self.form.join.level = res.level;
                            self.generateJoinUrl();
                        });
                }, angular.noop);
        }

        doUpdateJoinToken (level) {
            const self = this;
            const topicJoin = new this.TopicJoin({
                topicId: this.topic.id,
                userId: this.sAuth.user.id,
                level: level,
                token: this.form.join.token
            });

            topicJoin
                .$update()
                .then(() => {
                    self.form.join.level = level;
                });
        }

        copyInviteLink () {
            const urlInputElement = document.getElementById('url_invite_topic_input') as HTMLInputElement || null;
            urlInputElement.focus();
            urlInputElement.select();
            urlInputElement.setSelectionRange(0, 99999);
            document.execCommand('copy');
        }

        generateJoinUrl () {
            if (this.topic.join.token && this.topic.canUpdate()) {
                this.form.joinUrl = this.sLocation.getAbsoluteUrl('/topics/join/' + this.topic.join.token);
            }
        }

        closeThisDialog() {
            console.log('CLOSE');
            this.ngDialog.closeAll();
        }
    }]
}
angular
    .module('citizenos')
    .component(topicInvite.selector, topicInvite);
