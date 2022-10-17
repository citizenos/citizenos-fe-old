import * as angular from 'angular';

let topicVoteCast = {
    selector: 'topicVoteCast',
    templateUrl: '/views/components/topic_vote_cast.html',
    bindings: {
        vote: '='
    },
    controller: ['$log', 'Topic', 'Vote', 'TopicVote', 'VoteDelegation', 'sNotification', 'AppService', 'ngDialog', 'sTopic', class TopicVoteCastController {
        public STATUSES;
        public VISIBILITY;
        public VOTE_TYPES;
        public VOTE_AUTH_TYPES;
        private vote;
        private topic;
        public app;
        public userHasVoted;
        public multipleWinners = false;
        public showInfoWinners = false;

        constructor ($log, Topic, Vote, private TopicVote, private VoteDelegation, private sNotification, AppService, private ngDialog, private sTopic) {
            $log.debug('TopicVoteCastController');
            this.app = AppService;
            this.topic = this.app.topic;
            this.STATUSES = Topic.STATUSES;
            this.VISIBILITY = Topic.VISIBILITY;
            this.VOTE_TYPES = Vote.VOTE_TYPES;
            this.VOTE_AUTH_TYPES = Vote.VOTE_AUTH_TYPES;
            this.init();
        };

        init () {
            new this.TopicVote({id: this.topic.voteId, topicId: this.topic.id})
            .$get()
            .then((topicVote) => {
                this.vote = topicVote;
                this.vote.options.rows.forEach(option => {
                    console.log(option)
                    let winnerCount = 0;
                    if (option.selected) {
                        this.userHasVoted = true;
                    }
                    if (option.winner) {
                        winnerCount++;
                        if (winnerCount > 1) {
                            this.showInfoWinners = true;
                            this.multipleWinners = true;
                        }
                    }
                });
            })
        }

        isRadio (vote, option) {
            if (option.value === 'Neutral' || option.value === 'Veto') return true;
            if (vote.type ==='regular' || vote.maxChoices === 1) return true;

            return false;
        };

        hasVoteEndedExpired () {
            return [this.STATUSES.followUp, this.STATUSES.closed].indexOf(this.topic.status) < 0 && this.vote && this.vote.endsAt && new Date() > new Date(this.vote.endsAt);
        };

        hasVoteEnded () {
            if ([this.STATUSES.followUp, this.STATUSES.closed].indexOf(this.topic.status) > -1) {
                return true;
            }

            return this.vote && this.vote.endsAt && new Date() > new Date(this.vote.endsAt);
        };

        downloadContainer (includeCSV) {
            let url = this.vote.downloads.bdocFinal;
            if (!url) return;
            if (includeCSV) {
                url += '&include[]=csv';
            }

            window.location.href = url;
        };

        sendToFollowUp (stateSuccess) {
            this.app.topicsSettings = false;
            this.sTopic.changeState(this.app.topic, 'followUp', stateSuccess);
        };

        canSubmit () {
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

        doRevokeDelegation () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_vote_revoke_delegation_confirm.html',
                    data: {
                        user: this.vote.delegation
                    }
                })
                .then(() => {
                    this.VoteDelegation
                        .delete({topicId: this.topic.id, voteId: this.vote.id})
                        .$promise
                        .then(() => {
                            this.vote.topicId = this.topic.id;
                            this.vote.$get();
                        });
                }, angular.noop);
        };

        selectOption (option) {
         /*   if (!this.vote.canVote()) {
                return false;
            }*/
            this.vote.options.rows.forEach((opt) => {
                if (option.value === 'Neutral' || option.value === 'Veto' || this.vote.maxChoices ===1) {
                    opt.selected = false;
                } else if (opt.value === 'Neutral' || opt.value === 'Veto' || this.vote.maxChoices ===1) {
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
            option.selected=!option.selected;

        };

        doVote (option) {
            let options = [];
            //if (!$scope.topic.canVote()) return;
            if (!option) {
                options = this.vote.options.rows.filter((option) => {
                    return !!option.selected;
                });
            } else {
                options = [option];
            }
            if (options.length > this.vote.maxChoices || options.length < this.vote.minChoices && options[0].value !== 'Neutral' && options[0].value !== 'Veto') {
                this.sNotification.addError('MSG_ERROR_SELECTED_OPTIONS_COUNT_DOES_NOT_MATCH_VOTE_SETTINGS');
                return;
            }

            if (this.vote.authType === this.VOTE_AUTH_TYPES.hard) {
                const signDialog = this.ngDialog
                    .open({
                        template: '/views/modals/topic_vote_sign.html',
                        controller: 'TopicVoteSignCtrl',
                        data: {
                            options: options
                        },
                        preCloseCallback: (data) => {
                            if (data) {
                                this.vote.topicId = this.topic.id;

                                this.vote
                                    .$get()
                                    .then(() => {
                                        this.vote.options.rows.forEach((option) => {
                                            data.options.forEach((dOption) => {
                                                option.optionId = option.id;
                                                if (option.id === dOption.optionId) {
                                                    option.selected = true;
                                                }
                                            });
                                        });
                                        this.vote.downloads = {bdocVote: data.bdocUri};
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
                const userVote = new this.TopicVote({id: this.vote.id, topicId: this.topic.id});
                userVote.options = options
                userVote
                    .$save()
                    .then((data) => {
                        this.vote.topicId = this.topic.id;
                        this.sNotification.addSuccess('VIEWS.TOPICS_TOPICID.MSG_VOTE_REGISTERED');
                        this.getVote();
                    });
            }
        }

        getVote () {
            this.vote
                .$get()
                .then(() => {
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

        doDelegate () {
            if (!this.vote.delegation) {
                this.ngDialog
                    .open({
                        template: '/views/modals/topic_vote_delegate.html',
                        controller: 'TopicVoteDelegateCtrl',
                        preCloseCallback: (data) => {
                            if (data && data.delegateUser && data.delegateUser.id) {
                                const delegation = new this.VoteDelegation({topicId: this.topic.id, voteId: this.vote.id});
                                delegation.userId = data.delegateUser.id;
                                delegation
                                    .$save()
                                    .then((data) => {
                                        this.vote.topicId = this.topic.id;
                                        this.vote.$get();
                                    });
                            }
                            return true;
                        }
                    })
            }
        };

        getVoteValuePercentage (value) {
            if (!this.vote.getVoteCountTotal() || value < 1 || !value) return 0;
            return value / this.vote.getVoteCountTotal() * 100;
        };
    }]
};

angular
    .module('citizenos')
    .component(topicVoteCast.selector, topicVoteCast);

