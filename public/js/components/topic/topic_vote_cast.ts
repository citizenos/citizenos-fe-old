import * as angular from 'angular';

let topicVoteCast = {
    selector: 'topicVoteCast',
    templateUrl: '/views/components/topic_vote_cast.html',
    bindings: {
        visibility: '=',
        topicId: '=',
        vote: '=',
        status: '='
    },
    controller: ['$log', '$state', '$stateParams', 'Topic', 'Vote', 'TopicVote', 'VoteDelegation', 'sNotification', 'AppService', 'ngDialog', class TopicVoteCastController {
        public STATUSES;
        public VISIBILITY;
        public VOTE_TYPES;
        public VOTE_AUTH_TYPES
        public visibility;
        private vote;
        private status;
        private topicId;
        public app;
        public userHasVoted;
        public multipleWinners = false;
        public showInfoWinners = false;
        private sNotification;
        private ngDialog;
        private $state;
        private $stateParams;
        private Topic;
        private VoteDelegation;
        private TopicVote;

        constructor ($log, $state, $stateParams, Topic, Vote, TopicVote, VoteDelegation, sNotification, AppService, ngDialog) {
            $log.debug('TopicVoteCastController');
            this.Topic = Topic;
            this.TopicVote = TopicVote;
            this.VoteDelegation = VoteDelegation
            this.ngDialog = ngDialog;
            this.sNotification = sNotification;
            this.app = AppService;
            this.$state = $state;
            this.$stateParams = $stateParams;
            this.STATUSES = Topic.STATUSES;
            this.VISIBILITY = Topic.VISIBILITY;
            this.VOTE_TYPES = Vote.VOTE_TYPES;
            this.VOTE_AUTH_TYPES = Vote.VOTE_AUTH_TYPES;
           // this.init();
        };

        init () {
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
        }
        hasVoteEndedExpired () {
            return [this.STATUSES.followUp, this.STATUSES.closed].indexOf(this.status) < 0 && this.vote && this.vote.endsAt && new Date() > new Date(this.vote.endsAt);
        };

        hasVoteEnded () {
            if ([this.STATUSES.followUp, this.STATUSES.closed].indexOf(this.status) > -1) {
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
            const self = this;
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_send_to_followUp_confirm.html'
                })
                .then(() => {
                    return new this.Topic({
                        id: this.topicId,
                        status: this.STATUSES.followUp
                    }).$patch()
                    .then(() => {
                        this.app.topics_settings = false;
                        const stateNext = stateSuccess || 'topics/view/followUp';
                        const stateParams = angular.extend({}, self.$stateParams, {
                            editMode: null,
                            commentId: null
                        });
                        self.$state.go(
                            stateNext,
                            stateParams,
                            {
                                reload: true
                            }
                        );
                    });
                }, angular.noop);
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
            const self = this;
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_vote_revoke_delegation_confirm.html',
                    data: {
                        user: this.vote.delegation
                    }
                })
                .then(() => {
                    self.VoteDelegation
                        .delete({topicId: self.topicId, voteId: self.vote.id})
                        .$promise
                        .then(() => {
                            self.vote.topicId = self.topicId;
                            self.vote.$get();
                        });
                }, angular.noop);
        };

        selectOption (option) {
         /*   if (!this.vote.canVote()) {
                return false;
            }*/
            const self = this;
            this.vote.options.rows.forEach(function(opt) {
                if (option.value === 'Neutral' || option.value === 'Veto' || self.vote.maxChoices ===1) {
                    opt.selected = false;
                } else if (opt.value === 'Neutral' || opt.value === 'Veto' || self.vote.maxChoices ===1) {
                    opt.selected = false;
                }
            });

            option.optionId = option.id;

            var selected = this.vote.options.rows.filter((option) => {
                return !!option.selected;
            });

            var isSelected = selected.find((item) => {
                if (item.id === option.id) return item;
            });

            if (selected.length >= this.vote.maxChoices && !isSelected) return;
            option.selected=!option.selected;

        };

        doVote (option) {
            const self = this;
            console.log(self);
            let options = [];
            //if (!$scope.topic.canVote()) return;
            if (!option) {
                options = this.vote.options.rows.filter((option) => {
                    return !!option.selected;
                });
            } else {
                options = [option];
            }
            if (options.length > self.vote.maxChoices || options.length < self.vote.minChoices && options[0].value !== 'Neutral' && options[0].value !== 'Veto') {
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
                                self.vote.topicId = self.topicId;

                                self.vote
                                    .$get()
                                    .then(() => {
                                        self.vote.options.rows.forEach((option) => {
                                            data.options.forEach((dOption) => {
                                                option.optionId = option.id;
                                                if (option.id === dOption.optionId) {
                                                    option.selected = true;
                                                }
                                            });
                                        });
                                        self.vote.downloads = {bdocVote: data.bdocUri};
                                        self.userHasVoted = true;
                                    });
                                return true;
                            }
                        }
                    });

                signDialog.closePromise.then((data) => {
                    if(data.value) {
                        self.sNotification.addSuccess('VIEWS.TOPICS_TOPICID.MSG_VOTE_REGISTERED');
                    }
                });

                return;
            } else {
                const userVote = new self.TopicVote({id: self.vote.id, topicId: self.topicId});
                userVote.options = options
                userVote
                    .$save()
                    .then((data) => {
                        self.vote.topicId = self.topicId;
                        self.sNotification.addSuccess('VIEWS.TOPICS_TOPICID.MSG_VOTE_REGISTERED');
                        self.getVote();
                    });
            }
        }

        getVote () {
            const self = this;
            self.vote
                .$get()
                .then(() => {
                    if (self.vote && self.vote.options) {
                        var options = self.vote.options.rows;
                        for (var i in options) {
                            options[i].optionId = options[i].id;
                            if (options[i].selected) {
                                self.userHasVoted = true;
                            }
                        }
                    }
            });
        };
    }]
};

angular
    .module('citizenos')
    .component(topicVoteCast.selector, topicVoteCast);

