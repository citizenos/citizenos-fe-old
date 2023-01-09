import * as angular from 'angular';

let feedback = {
    selector: 'feedback',
    templateUrl: '/views/components/feedback.html',
    bindings: {},
    controller: ['$http', 'sLocation', '$translate', 'sNotification', class FeedbackController {
        public message;
        public message2;
        public error = false;
        public error2 = false;
        public isSubmitted = false;
        constructor (private $http, private sLocation, private $translate, private sNotification) {

        }

        submitFeedback () {
            this.error = this.error2 = false;
            const q1 = this.$translate.instant('MODALS.GIVE_FEEDBACK_QUESTION_1');
            const q2 = this.$translate.instant('MODALS.GIVE_FEEDBACK_QUESTION_2');
            const path = this.sLocation.getAbsoluteUrlApi('/api/internal/feedback');
            if (!this.message ) {
                this.error = true;
            }
            if(!this.message2) {
                this.error2 = true;
            }
            if (this.error || this.error2) return;
            const finalMessage = `
            ${q1}
            ${this.message}
            ${q2}
            ${this.message2}
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
