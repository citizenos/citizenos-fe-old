import * as angular from 'angular';
import * as moment from 'moment';

let cosModalDatepicker = {
    selector: 'cosModalDatepicker',
    templateUrl: '/views/directives/cos_modal_datepicker.html',
    bindings: {
        date: '=?',
        model: '=ngModel',
        cosModalOnSave: '&', // Expects a function that returns a Promise
        cosModalTitle: '=?',
        cosModalDescription: '=?',
        cosModalLinkText: '=?'
    },
    controller: ['$log', '$timeout', '$translate', class CosDatePickerController {
        private $log;
        private $timeout;
        private $translate;

        private form;
        private cosModalTitle;
        private cosModalDescription;
        private cosModalLinkText;
        private cosModalIsDateSelected;
        private datePickerMin;
        private isModalVisible;
        private date;
        private model;
        private cosModalOnSave; // Expects a function that returns a Promise
        private timezones;
        private HCount;


        constructor ($log, $timeout, $translate) {
            this.$log = $log;
            this.$timeout = $timeout;
            this.$translate = $translate;
            this.datePickerMin = new Date();
            this.cosModalIsDateSelected = true;

            this.isModalVisible = false;
            this.form = {
                endsAt: {
                    date: null,
                    min: 0,
                    h: 0,
                    timezone: moment().utcOffset()/60,
                    timeFormat: 24
                },
                deadline: this.model,
                numberOfDaysLeft: 0
            };

            if (this.cosModalDescription) {
                this.$translate(this.cosModalDescription)
                    .then((translatedDescription) =>  this.cosModalDescription = translatedDescription);
            }

            if (this.cosModalTitle) {
                this.$translate(this.cosModalTitle)
                    .then((translatedTitle) =>  this.cosModalTitle = translatedTitle);
            }

            if (this.cosModalLinkText) {
                this.$translate(this.cosModalLinkText)
                    .then((translatedLinkText) => this.cosModalLinkText = translatedLinkText);
            } else {
                this.cosModalLinkText = 'Edit'
            }

            this.timezones = [
                {name: "Etc/GMT+0", value: 0},
                {name: "Etc/GMT+1", value: 1},
                {name: "Etc/GMT+2", value: 2},
                {name: "Etc/GMT+3", value: 3},
                {name: "Etc/GMT+4", value: 4},
                {name: "Etc/GMT+5", value: 5},
                {name: "Etc/GMT+6", value: 6},
                {name: "Etc/GMT+7", value: 7},
                {name: "Etc/GMT+8", value: 8},
                {name: "Etc/GMT+9", value: 9},
                {name: "Etc/GMT+10", value: 10},
                {name: "Etc/GMT+11", value: 11},
                {name: "Etc/GMT+12", value: 12},
                {name: "Etc/GMT-0", value: -0},
                {name: "Etc/GMT-1", value: -1},
                {name: "Etc/GMT-2", value: -2},
                {name: "Etc/GMT-3", value: -3},
                {name: "Etc/GMT-4", value: -4},
                {name: "Etc/GMT-5", value: -5},
                {name: "Etc/GMT-6", value: -6},
                {name: "Etc/GMT-7", value: -7},
                {name: "Etc/GMT-8", value: -8},
                {name: "Etc/GMT-9", value: -9},
                {name: "Etc/GMT-10", value: -10},
                {name: "Etc/GMT-11", value: -11},
                {name: "Etc/GMT-12", value: -12},
                {name: "Etc/GMT-13", value: -13},
                {name: "Etc/GMT-14", value: -14}
            ];

            this.HCount = 24;
        };

        cosModalOpen (date) {
            this.isModalVisible = true;
            if (date) {
                this.setFormValues();
            }
        };

        cosModalClose () {
            this.isModalVisible = false;
        };

        cosModalSaveAction () {
            // The 'add' and 'subtract' - because the picked date is inclusive
            this.model = this.cosModalIsDateSelected ? this.form.deadline : null;

            this.$timeout(() => {
                this.cosModalOnSave()()
                    .then(() => {
                        this.cosModalClose();
                    });
            });
        };

        formatTime (val) {
            if (val < 10) {
                val = '0' + val;
            }
        };

        getTimeZoneName (value) {
            return (this.timezones.find((item) => {return item.value === value})).name;
        };

        setTimeFormat () {
            this.HCount = 24;

            if (this.form.timeFormat !== 24) {
                this.HCount = 12;
                if (this.form.endsAt.h > 12) {
                    this.form.endsAt.h -= 12;
                }
            }
            this.setEndsAtTime();
        };

        daysToVoteEnd () {
            if (this.form.deadline) {
                if (this.form.deadline === true) {
                    this.form.deadline = new Date();
                }
                let diffTime = new Date(this.form.deadline).getTime() - new Date().getTime();
                this.form.numberOfDaysLeft = Math.ceil(diffTime / (1000 * 3600 * 24)); // Diff in days
            }
            return this.form.numberOfDaysLeft;
        };

        setEndsAtTime () {
            this.$log.debug('SET ENDS AT')
            this.form.endsAt.date = this.form.endsAt.date || new Date();
            this.form.deadline = moment(this.form.endsAt.date);
            this.form.deadline.utcOffset(this.form.endsAt.timezone, true);
            var hour = this.form.endsAt.h;
            if (this.form.endsAt.timeFormat === 'PM') { hour += 12; }
            this.form.deadline.hour(hour);
            this.form.deadline.minute(this.form.endsAt.min);
        };

        setFormValues () {
            this.form.deadline = this.model;
            this.form.endsAt.date = this.model;
            this.form.endsAt.min = moment(this.form.deadline).minutes();
            this.form.endsAt.h = moment(this.form.deadline).hours();
            this.form.endsAt.timezone = moment(this.form.deadline).utcOffset()/60;
            this.cosModalIsDateSelected = true;
        };
    }]
};

angular
    .module('citizenos')
    .component(cosModalDatepicker.selector, cosModalDatepicker);

