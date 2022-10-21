import * as angular from 'angular';

let feedback = {
    selector: 'feedback',
    templateUrl: '/views/components/feedback.html',
    bindings: {},
    controller: ['$http', 'sLocation', 'sNotification', class FeedbackController {
        private message;
        private isSubmitted = false;
        constructor (private $http, private sLocation, private sNotification) {

        }

        submitFeedback () {
            const path = this.sLocation.getAbsoluteUrlApi('/api/internal/feedback');
            return this.$http.post(path, {message:this.message}).then(() => {
                this.isSubmitted = true;
            }, (err) => {
                this.sNotification.error(err);
            });
        }
    }]
};

angular
    .module('citizenos')
    .component(feedback.selector, feedback);
