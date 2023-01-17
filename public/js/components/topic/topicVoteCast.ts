import * as angular from 'angular';

let topicVoteCast = {
    selector: 'topicVoteCast',
    templateUrl: '/views/components/topic/topic_vote_cast.html',
    bindings: {
        vote: '='
    },
    controller: ['$log', 'Topic', 'TopicVote', 'VoteDelegation', 'sNotification', 'AppService', 'ngDialog', 'TopicVoteService', class TopicVoteCastController {
        public STATUSES;
        public VISIBILITY;
        public VOTE_TYPES;
        public VOTE_AUTH_TYPES;
        private vote;
        private topic;
        public userHasVoted;
        public multipleWinners = false;
        public showInfoWinners = false;

        constructor($log, private Topic, private TopicVote, private VoteDelegation, private sNotification, private app, private ngDialog, private TopicVoteService) {
            $log.debug('TopicVoteCastController', this.vote);
            this.topic = this.app.topic;
            TopicVoteService.topicId = this.topic.id;
            this.STATUSES = Topic.STATUSES;
            this.VISIBILITY = Topic.VISIBILITY;
            this.VOTE_TYPES = TopicVote.VOTE_TYPES;
            this.VOTE_AUTH_TYPES = TopicVote.VOTE_AUTH_TYPES;
            this.TopicVoteService.voteId = this.topic.voteId;

        };

        canDelegate() {
            const topic = this.topic;
            if (this.vote) {
                return (this.Topic.canVote(topic) && this.vote.delegationIsAllowed === true);
            }
        };

        isRadio(vote, option) {
            if (option.value === 'Neutral' || option.value === 'Veto') return true;
            if (vote.type === 'regular' || vote.maxChoices === 1) return true;

            return false;
        };

        hasVoteEndedExpired() {
            return [this.STATUSES.followUp, this.STATUSES.closed].indexOf(this.topic.status) < 0 && this.vote && this.vote.endsAt && new Date() > new Date(this.vote.endsAt);
        };

        hasVoteEnded() {
            if ([this.STATUSES.followUp, this.STATUSES.closed].indexOf(this.topic.status) > -1) {
                return true;
            }

            return this.vote && this.vote.endsAt && new Date() > new Date(this.vote.endsAt);
        };

        downloadContainer(includeCSV) {
            let url = this.vote.downloads.bdocFinal;
            if (!url) return;
            if (includeCSV) {
                url += '&include[]=csv';
            }

            window.location.href = url;
        };

        sendToFollowUp(stateSuccess) {
            this.app.topicsSettings = false;
            this.Topic.changeState(this.app.topic, 'followUp', stateSuccess);
        };

        canSubmit() {
            if (!this.vote.options || !Array.isArray(this.vote.options.rows)) return false;
            const options = this.vote.options.rows.filter((option) => {
                return !!option.selected;
            });

            if (options && options.length === 1 && (options[0].value === 'Neutral' || options[0].value === 'Veto')) {
                return true;
            }

            if (options.length > this.vote.maxChoices || options.length < this.vote.minChoices)
                return false;

            return true;
        };

        doRevokeDelegation() {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_vote_revoke_delegation_confirm.html',
                    data: {
                        user: this.vote.delegation
                    }
                })
                .then(() => {
                    this.VoteDelegation
                        .delete({ topicId: this.topic.id, voteId: this.vote.id })
                        .then(() => {
                            this.vote.topicId = this.topic.id;
                            this.TopicVote.get(this.vote).then((vote) => {
                                this.vote = vote;
                            });
                        });
                }, angular.noop);
        };

        selectOption(option) {
            /*   if (!this.vote.canVote()) {
                   return false;
               }*/
            this.vote.options.rows.forEach((opt) => {
                if (option.value === 'Neutral' || option.value === 'Veto' || this.vote.maxChoices === 1) {
                    opt.selected = false;
                } else if (opt.value === 'Neutral' || opt.value === 'Veto' || this.vote.maxChoices === 1) {
                    opt.selected = false;
                }
            });

            option.optionId = option.id;

            const selected = this.vote.options.rows.filter((option) => {
                return !!option.selected;
            });

            const isSelected = selected.find((item) => {
                if (item.id === option.id) return item;
            });

            if (selected.length >= this.vote.maxChoices && !isSelected) return;
            option.selected = !option.selected;

        };

        doVote(option) {
            let options = [];
            //if (!$scope.topic.canVote()) return;
            if (!option) {
                options = this.vote.options.rows.filter((option) => {
                    option.optionId = option.id;
                    return !!option.selected;
                });
            } else {
                options = [option];
            }
            if (options.length > this.vote.maxChoices || options.length < this.vote.minChoices && options[0].value !== 'Neutral' && options[0].value !== 'Veto') {
                this.sNotification.addError('MSG_ERROR_SELECTED_OPTIONS_COUNT_DOES_NOT_MATCH_VOTE_SETTINGS');
                return;
            }
            this.TopicVoteService.options = options;
            if (this.vote.authType === this.VOTE_AUTH_TYPES.hard) {
                const signDialog = this.ngDialog
                    .open({
                        template: '<topic-vote-sign options="options"></topic-vote-sign>',
                        plain: true,
                        preCloseCallback: (data) => {
                            if (data) {
                                this.vote.topicId = this.topic.id;

                                this.TopicVote
                                    .get(this.vote)
                                    .then((vote) => {
                                        this.vote = vote;
                                        this.vote.options.rows.forEach((option) => {
                                            data.options.forEach((dOption) => {
                                                option.optionId = option.id;
                                                if (option.id === dOption.optionId) {
                                                    option.selected = true;
                                                }
                                            });
                                        });
                                        this.vote.downloads = { bdocVote: data.bdocUri };
                                        this.userHasVoted = true;
                                    });
                                return true;
                            }
                        }
                    });

                signDialog.closePromise.then((data) => {
                    if (data.value) {
                        this.sNotification.addSuccess('VIEWS.TOPICS_TOPICID.MSG_VOTE_REGISTERED');
                    }
                });

                return;
            } else {
                options.forEach((dOption) => {
                    dOption.optionId = dOption.id;
                });
                this.TopicVote
                    .cast({ voteId: this.vote.id, topicId: this.topic.id, options: options })
                    .then((data) => {
                        this.vote.topicId = this.topic.id;
                        this.sNotification.addSuccess('VIEWS.TOPICS_TOPICID.MSG_VOTE_REGISTERED');
                        this.getVote();
                    });
            }
        }

        getVote() {
            this.TopicVote
                .get(this.vote)
                .then((vote) => {
                    this.vote = vote;
                    if (this.vote && this.vote.options) {
                        const options = this.vote.options.rows;
                        for (var i in options) {
                            options[i].optionId = options[i].id;
                            if (options[i].selected) {
                                this.userHasVoted = true;
                            }
                        }
                    }
                });
        };

        doDelegate() {
            if (!this.vote.delegation) {
                this.ngDialog
                    .open({
                        template: '<topic-vote-delegate></topic-vote-delegate>',
                        plain: true
                    })
            }
        };

        getVoteValuePercentage(value) {
            if (!this.vote.getVoteCountTotal() || value < 1 || !value) return 0;
            return value / this.vote.getVoteCountTotal() * 100;
        };
    }]
};

angular
    .module('citizenos')
    .component(topicVoteCast.selector, topicVoteCast);

