'use strict';
import * as angular from 'angular';
import {filter, find, isArray} from 'lodash';

let topicVote = {
    selector: 'topicVote',
    template: '<div ui-view></div>',
    bindings: {},
    controller: ['$scope', '$log', 'TopicVote', 'Vote', 'VoteDelegation', 'ngDialog', 'sNotification', 'AppService', class TopicVoteController {
        public app;
        public topic;
        public userHasVoted;
        public voteTypes = [];
        public voteAuthTypes = [];

        constructor (private $scope, private $log, private TopicVote, private Vote, private VoteDelegation, private ngDialog, private sNotification, private  AppService) {
            $log.debug('TopicVoteCtrl');
            this.app = AppService;
            this.topic = AppService.topic;
            this.topic.vote.topicId = this.topic.id;
            this.voteTypes = Vote.VOTE_TYPES;
            this.voteAuthTypes = Vote.VOTE_AUTH_TYPES;
            this.getVote();
        }

        getVote () {
            this.topic.vote.$get().then(() => {
                if (this.topic.vote && this.topic.vote.options) {
                    const  options = this.topic.vote.options.rows;
                    for (var i in options) {
                        options[i].optionId = options[i].id;
                        if (options[i].selected) {
                            this.userHasVoted = true;
                        }
                    }
                }
            });
        };

        selectOption (option) {
            if (!this.topic.canVote()) {
                return false;
            }

            this.topic.vote.options.rows.forEach((opt) => {
                if (option.value === 'Neutral' || option.value === 'Veto' || this.topic.vote.maxChoices ===1) {
                    opt.selected = false;
                } else if (opt.value === 'Neutral' || opt.value === 'Veto' || this.topic.vote.maxChoices ===1) {
                    opt.selected = false;
                }
            });

            option.optionId = option.id;

            const selected = filter(this.topic.vote.options.rows, function (option) {
                return !!option.selected;
            });

            const isSelected = find(selected, function (item) {
                if (item.id === option.id) return item;
            });

            if (selected.length >= this.topic.vote.maxChoices && !isSelected) return;

            option.selected = !option.selected;
        };

        canSubmit () {
            if (!this.topic.vote.options || !isArray(this.topic.vote.options.rows)) return false;
            const options = filter(this.topic.vote.options.rows, function (option) {
                return !!option.selected;
            });

            if (options && options.length === 1 && (options[0].value === 'Neutral' || options[0].value === 'Veto')) {
                return true;
            }

            if (options.length > this.topic.vote.maxChoices || options.length < this.topic.vote.minChoices) {
                return false;
            }

            return true;
        };

        doVote (option) {
            let options = [];
            if (!this.topic.canVote()) return;

            if (!option) {
                options = filter(this.topic.vote.options.rows, function (option) {
                    return !!option.selected;
                });
            } else {
                options = [option];
            }
            if (options.length > this.topic.vote.maxChoices || options.length < this.topic.vote.minChoices && options[0].value !== 'Neutral' && options[0].value !== 'Veto') {
                return this.sNotification.addError('MSG_ERROR_SELECTED_OPTIONS_COUNT_DOES_NOT_MATCH_VOTE_SETTINGS');
            }

            if (this.topic.vote.authType === this.voteAuthTypes['hard']) {
                const signDialog = this.ngDialog
                    .open({
                        template: '/views/modals/topic_vote_sign.html',
                        controller: 'TopicVoteSignCtrl',
                        data: {
                            topic: this.topic,
                            options: options
                        },
                        preCloseCallback: (data) => {
                            if (data) {
                                this.topic.vote.topicId = this.topic.id;

                                this.topic.vote.$get()
                                    .then(() => {
                                        this.topic.vote.options.rows.forEach((option) => {
                                            data.options.forEach((dOption) => {
                                                option.optionId = option.id;
                                                if (option.id === dOption.optionId) {
                                                    option.selected = true;
                                                }
                                            });
                                        });
                                        this.topic.vote.downloads = {bdocVote: data.bdocUri};
                                        this.userHasVoted = true;
                                    });
                                return true;
                            }
                        }
                    });

                signDialog.closePromise.then((data) => {
                    if(data.value) {
                        this.sNotification.addSuccess('VIEWS.TOPICS_TOPICID.MSG_VOTE_REGISTERED');
                    }
                });

                return;
            } else {
                const userVote = new this.TopicVote({id: this.topic.vote.id, topicId: this.topic.id});
                userVote.options = options
                userVote
                    .$save()
                    .then(() => {
                        this.topic.vote.topicId = this.topic.id;
                        this.sNotification.addSuccess('VIEWS.TOPICS_TOPICID.MSG_VOTE_REGISTERED');
                        this.getVote();
                    });
            }
        };

        doDelegate () {
            if (!this.topic.vote.delegation) {
                this.ngDialog
                    .open({
                        template: '/views/modals/topic_vote_delegate.html',
                        controller: 'TopicVoteDelegateCtrl',
                        data: {
                            topic: this.topic
                        },
                        preCloseCallback: (data) => {
                            if (data && data.delegateUser && data.delegateUser.id) {
                                const delegation = new this.VoteDelegation({topicId: this.topic.id, voteId: this.topic.vote.id});
                                delegation.userId = data.delegateUser.id;
                                delegation
                                    .$save()
                                    .then((data) => {
                                        this.topic.vote.topicId = this.topic.id;
                                        this.topic.vote.$get();
                                    });
                            }
                            return true;
                        }
                    })
            }
        };

        doRevokeDelegation () {
            this.$log.debug('doDeleteTopic');

            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_vote_revoke_delegation_confirm.html',
                    data: {
                        user: this.topic.vote.delegation
                    }
                }).then(() => {
                    this.VoteDelegation
                        .delete({topicId: this.topic.id, voteId: this.topic.vote.id})
                        .$promise
                        .then(() => {
                            this.topic.vote.topicId = this.topic.id;
                            this.topic.vote.$get();
                        });
                }, angular.noop);
        };

        getVoteValuePercentage (value) {
            if (!this.topic.vote.getVoteCountTotal() || value < 1 || !value) return 0;
            return value / this.topic.vote.getVoteCountTotal() * 100;
        };
    }]
};

angular
    .module('citizenos')
    .component(topicVote.selector, topicVote);
