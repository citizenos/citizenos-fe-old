import * as angular from 'angular';

let cosInitials = {
    selector: 'cosInitials',
    template:  `
        {{$ctrl.initials}}
    `,
    bindings: {
        model: '=ngModel',
        initialLimit: '='
    },
    controller: ['$timeout', class CosInitialsController {
        private initials;
        private model;
        private initialLimit;
        private $timeout;

        constructor ($timeout) {
            this.initials = '';
            this.$timeout = $timeout;
            this.$timeout(() => this.updateInitials(this.model));
        }

        updateInitials (name) {
            const parts = name.split(/\s+/);
            if (parts.length === 1 || this.initialLimit === 1) {
                this.initials = parts[0][0].toUpperCase();
            } else {
                this.initials = parts[0][0].toUpperCase() + parts.pop()[0].toUpperCase();
            }
        }
    }]
}

angular
    .module('citizenos')
    .component(cosInitials.selector, cosInitials);
