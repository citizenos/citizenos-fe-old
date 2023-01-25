import * as angular from 'angular';

let feedback = {
    selector: 'feedback',
    templateUrl: '/views/components/feedback.html',
    bindings: {},
    controller: ['$http', 'sLocation', '$translate', 'sNotification', class FeedbackController {
        public name = '';
        public email = '';
        public org = '';
        public message = '';
        public allowContact = false;
        public error = false;
        public isSubmitted = false;
        constructor (private $http, private sLocation, private $translate, private sNotification) {

        }

        submitFeedback () {
            this.error = false;
            const q1 = this.$translate.instant('MODALS.GIVE_FEEDBACK_QUESTION_1');
            const q2 = this.$translate.instant('MODALS.GIVE_FEEDBACK_QUESTION_2');
            const path = this.sLocation.getAbsoluteUrlApi('/api/internal/feedback');
            if (!this.message ) {
                this.error = true;
            }
            if (this.error) return;
            let allowContact = 'No';
            if(this.allowContact) {
                allowContact = 'Yes';
            }
            const finalMessage = `
            Name: ${this.name}
            Email: ${this.email}
            Group/Organization: ${this.org}
            ${q1}
            ${this.message}
            ${q2}
            ${allowContact}
            `;
            return this.$http.post(path, {message:finalMessage}).then(() => {
                this.isSubmitted = true;
            }, (err) => {
                console.log(err);
                this.sNotification.addError(err.message);
            });
        }
    }]
};

angular
    .module('citizenos')
    .component(feedback.selector, feedback);
