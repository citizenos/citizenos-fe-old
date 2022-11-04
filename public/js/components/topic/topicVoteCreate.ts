import * as angular from 'angular';
import { runInThisContext } from 'vm';

let topicVoteCreate = {
    selector: 'topicVoteCreate',
    templateUrl: '/views/components/topic/topic_vote_create.html',
    bindings: {},
    controller: ['$log', '$state', '$translate', 'TopicVote', 'sNotification', 'AppService', class TopicVoteCreateController {
        public VOTE_TYPES;
        public VOTE_AUTH_TYPES
        private topicId;
        public userHasVoted;

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

        public reminderOptions = [{value: 1, unit: 'days'}, {value: 2, unit: 'days'}, {value: 3, unit: 'days'}, {value: 1, unit: 'weeks'}, {value: 2, unit: 'weeks'}, {value: 1, unit: 'month'}];

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
            reminder: false,
            reminderTime: null,
            voteType: null,
            authType: null,
            numberOfDaysLeft: 0,
            errors: null,
            autoClose: null
        };

        constructor (private $log, private $state, private $translate, private TopicVote, private sNotification, private app) {
            $log.debug('TopicVoteCastController');
            this.topicId = app.topic.id;
            this.VOTE_TYPES = TopicVote.VOTE_TYPES;
            this.VOTE_AUTH_TYPES = TopicVote.VOTE_AUTH_TYPES;
           // this.init();

           this.voteForm.extraOptions = angular.copy(this.CONF.extraOptions);
           this.voteForm.authType = TopicVote.VOTE_AUTH_TYPES.soft;
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

        isVisibleReminderOption (time) {
            let timeItem = new Date(this.voteForm.deadline);
            switch (time.unit) {
                case 'weeks':
                    timeItem.setDate(timeItem.getDate() + 1 - (time.value * 7));
                    break;
                case 'month':
                    timeItem.setMonth(timeItem.getMonth() - time.value);
                    break
                default:
                    timeItem.setDate(timeItem.getDate() + 1 - time.value);
            }
            if (timeItem > new Date()) return true;

            return false;
        };

        setVoteReminder (time) {
            let reminderTime = new Date(this.voteForm.deadline);
            switch (time.unit) {
                case 'weeks':
                    reminderTime.setDate(reminderTime.getDate() - (time.value * 7));
                    break;
                case 'month':
                    reminderTime.setMonth(reminderTime.getMonth() - time.value);
                    break
                default:
                    reminderTime.setDate(reminderTime.getDate() - time.value);
            }
            this.voteForm.reminderTime = reminderTime;
        };

        selectedReminderOption () {
            let voteDeadline = new Date(this.voteForm.deadline);
            let reminder = new Date(this.voteForm.reminderTime);
            let diffTime = voteDeadline.getTime() - reminder.getTime();
            const days = Math.ceil(diffTime / (1000 * 3600 * 24));
            const weeks = Math.ceil(diffTime / (1000 * 3600 * 24 * 7));
            const months = (voteDeadline.getMonth() - reminder.getMonth() +
                12 * (voteDeadline.getFullYear() - reminder.getFullYear()));

            let item = this.reminderOptions.find((item) => {
                if ( item.value === days && item.unit === 'days') return item;
                else if ( item.value === weeks && item.unit === 'weeks') return item;
                else if ( item.value === months && item.unit === 'month') return item;
            });

            if (!item) {
                item = this.reminderOptions[0];
                this.setVoteReminder(item);
            }

            return this.$translate.instant('OPTION_' + item.value + '_'+ item.unit.toUpperCase());
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

                if (this.voteForm.deadline.toDateString() === new Date().toDateString()) {
                    this.voteForm.deadline = new Date()//moment(new Date()).startOf('day').add(1, 'day');
                    this.voteForm.deadline = this.voteForm.deadline.setDate(this.voteForm.deadline.getDate() + 1);
                    this.voteForm.endsAt.date = this.voteForm.deadline;
                }
                this.voteForm.numberOfDaysLeft = Math.ceil((new Date(this.voteForm.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            }
            return this.voteForm.numberOfDaysLeft;
        };

        createVote () {
            this.sNotification.removeAll();

            const vote = {
                topicId: this.topicId,
                options: angular.copy(this.voteForm.options),
                delegationIsAllowed:  this.voteForm.delegationIsAllowed,
                type: this.voteForm.voteType,
                authType: this.voteForm.authType,
                maxChoices: this.voteForm.maxChoices,
                minChoices: this.voteForm.minChoices,
                reminderTime: this.voteForm.reminderTime,
                autoClose: null,
                endsAt: this.voteForm.deadline
            };


            for (let o in this.voteForm.extraOptions) {
                var option = this.voteForm.extraOptions[o];
                if (option.enabled) {
                    vote.options.push({value: option.value});
                }
            }

            if (!this.voteForm.reminder) {
                vote.reminderTime = this.voteForm.reminderTime = null;
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

            this.TopicVote.save(vote)
                .then((vote) => {
                    this.voteForm.errors = null;
                    this.$state.go('topics/view/votes/view', {
                            topicId: this.topicId,
                            voteId: vote.id
                        }, {reload: true});
                    },(res) => {
                        this.$log.debug('createVote() ERR', res, res.data.errors,  this.voteForm.options);
                        this.voteForm.errors = res.data.errors;
                });
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

