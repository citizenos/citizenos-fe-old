import * as angular from 'angular';
import { runInThisContext } from 'vm';

let topicVoteCreate = {
    selector: 'topicVoteCreate',
    templateUrl: '/views/components/topic_vote_create.html',
    bindings: {
        topicId: '='
    },
    controller: ['$log', '$state', 'Topic', 'Vote', 'sNotification', 'AppService', class TopicVoteCreateController {
        public VOTE_TYPES;
        public VOTE_AUTH_TYPES
        private topicId;
        private $log;
        public app;
        public userHasVoted;
        private sNotification;
        private $state;
        private Vote;

        public datePickerMin = new Date();
        public HCount = 24;
        public timezones = [];

        private CONF = {
            defaultOptions: {
                regular: [
                    {
                        value: 'Yes',
                        enabled: true
                    },
                    {
                        value: 'No',
                        enabled: true
                    }
                ],
                multiple: [
                    {value: null},
                    {value: null},
                    {value: null}
                ]
            },
            extraOptions: {
                neutral: {
                    value: 'Neutral',
                    enabled: false
                }, // enabled - is the option enabled by default
                veto: {
                    value: 'Veto',
                    enabled: false
                }
            },
            autoClose: {
                allMembersVoted: {
                    value: 'allMembersVoted',
                    enabled: false
                }
            },
            optionsMax: 10,
            optionsMin: 2
        };

        public voteForm = {
            options: [],
            maxChoices: 1,
            minChoices: 1,
            extraOptions: null,
            delegationIsAllowed: false,
            endsAt: {
                date: null,
                min: 0,
                h: 0,
                timezone: new Date().getTimezoneOffset()/-60,
                timeFormat: '24'
            },
            timeFormat: null,
            deadline: null,
            voteType: null,
            authType: null,
            numberOfDaysLeft: 0,
            errors: null,
            autoClose: null
        };

        constructor ($log, $state, Topic, Vote, sNotification, AppService) {
            $log.debug('TopicVoteCastController');
            this.$log = $log;
            this.Vote = Vote;
            this.sNotification = sNotification;
            this.app = AppService;
            this.$state = $state;
            this.VOTE_TYPES = Vote.VOTE_TYPES;
            this.VOTE_AUTH_TYPES = Vote.VOTE_AUTH_TYPES;
           // this.init();

           this.voteForm.extraOptions = angular.copy(this.CONF.extraOptions);
           this.voteForm.authType = Vote.VOTE_AUTH_TYPES.soft;
           this.voteForm.autoClose =  angular.copy(this.CONF.autoClose);

           this.setTimeZones();
        };

        private setTimeZones () {
            let x = -14;
            while (x <= 12) {
                let separator = '+';
                if (x < 0) separator = '';
                this.timezones.push({
                    name: "Etc/GMT"+separator+x,
                    value: x
                })
                x++;
            }
        };

        formatTime (val) {
            if (val < 10) {
                val = '0' + val;
            }

            return val;
        };

        getTimeZoneName  (value) {
            return (this.timezones.find((item) => {return item.value === value})).name;
        };

        setVoteType (voteType) {
            if (voteType == this.VOTE_TYPES.multiple) {
                this.voteForm.voteType = voteType;
                this.voteForm.options = angular.copy(this.CONF.defaultOptions.multiple);
                this.voteForm.maxChoices = 1;
            } else {
                this.voteForm.voteType = this.VOTE_TYPES.regular;
                this.voteForm.options = angular.copy(this.CONF.defaultOptions.regular);
            }
        };


        setTimeFormat () {
            this.HCount = 24;

            if (this.voteForm.timeFormat !== 24) {
                this.HCount = 12;
                if (this.voteForm.endsAt.h > 12) {
                    this.voteForm.endsAt.h -= 12;
                }
            }
            this.setEndsAtTime();
        };

        setEndsAtTime () {
            this.voteForm.endsAt.date = this.voteForm.endsAt.date || new Date();
            this.voteForm.deadline = new Date(this.voteForm.endsAt.date);

            let hour = this.voteForm.endsAt.h;
            if (this.voteForm.endsAt.timeFormat === 'PM') { hour += 12; }
            this.voteForm.deadline.setUTCHours(hour - this.voteForm.endsAt.timezone);
            this.voteForm.deadline.setMinutes(this.voteForm.endsAt.min);
            this.daysToVoteEnd();
        };

        optionsCountUp (type) {
            const options = this.voteForm.options.filter((option) => {
                return !!option.value;
            });
            if (type === 'min' && this.voteForm.minChoices < options.length) {
                this.voteForm.minChoices++;
                if (this.voteForm.minChoices > this.voteForm.maxChoices) {
                    this.voteForm.maxChoices = this.voteForm.minChoices;
                }
            } else if (this.voteForm.maxChoices < options.length) {
                this.voteForm.maxChoices++;
            }
        };

        optionsCountDown (type) {
            if (type === 'min' && this.voteForm.minChoices > 1) {
                this.voteForm.minChoices--;
            }
            else if (this.voteForm.maxChoices > 1) {
                this.voteForm.maxChoices--;
                if (this.voteForm.minChoices > this.voteForm.maxChoices) {
                    this.voteForm.minChoices = this.voteForm.maxChoices;
                }
            }
        };

        getStepNum (num) {
            if (this.voteForm.voteType === this.VOTE_TYPES.multiple) {
                num++;
            }

            return num;
        };

        removeOption (key) {
            this.voteForm.options.splice(key, 1);
        };

        addOption () {
            this.voteForm.options.push({value: null});
        };

        daysToVoteEnd () {
            if (this.voteForm.deadline) {

                console.log(this.voteForm.deadline)
                if (this.voteForm.deadline === true) {
                    this.voteForm.deadline = new Date()//moment(new Date()).startOf('day').add(1, 'day');
                    this.voteForm.deadline = this.voteForm.deadline.setDate(this.voteForm.deadline.getDate() + 1);
                    this.voteForm.endsAt.date = this.voteForm.deadline;
                    console.log(this.voteForm.deadline)
                }
                this.voteForm.numberOfDaysLeft = Math.floor((new Date(this.voteForm.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            }
            return this.voteForm.numberOfDaysLeft;
        };

        createVote () {
            const self = this;
            this.sNotification.removeAll();

            const vote = new this.Vote({topicId: this.topicId});
            vote.options = angular.copy(this.voteForm.options);
            vote.delegationIsAllowed = this.voteForm.delegationIsAllowed;
            vote.type = this.voteForm.voteType;
            vote.authType = this.voteForm.authType;
            vote.maxChoices = this.voteForm.maxChoices;
            vote.minChoices = this.voteForm.minChoices;

            for (let o in this.voteForm.extraOptions) {
                var option = this.voteForm.extraOptions[o];
                if (option.enabled) {
                    vote.options.push({value: option.value});
                }
            }

            let autoClose = [];
            for (let i in this.voteForm.autoClose) {
                const option = this.voteForm.autoClose[i];
                if (option.enabled) {
                    autoClose.push({value: option.value});
                }
            }

            if (!autoClose.length) {
                autoClose = null;
            }
            vote.autoClose = autoClose;

            vote.options = vote.options.filter((option) => {
                return !!option.value
            });

            // Ends at midnight of the date chosen, thus 00:00:00 of the next day.
            const endsAt = this.voteForm.deadline;

            if (endsAt) {
                vote.endsAt = endsAt;
            }

            vote
                .$save((vote, putResponseHeaders) => {
                    self.voteForm.errors = null;
                    self.$state.go('topics/view/votes/view', {
                            topicId: self.topicId,
                            voteId: vote.id
                        }, {reload: true});
                    },(res) => {
                        self.$log.debug('createVote() ERR', res, res.data.errors,  self.voteForm.options);
                        self.voteForm.errors = res.data.errors;
                    }
                );
        };

        getDeadline() {
            if(this.voteForm.deadline === true) {
                this.setEndsAtTime();
            }

            return this.voteForm.deadline;
        }
    }]
};

angular
    .module('citizenos')
    .component(topicVoteCreate.selector, topicVoteCreate);

