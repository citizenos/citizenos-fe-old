import * as angular from 'angular';

let cosToggle = {
    selector: 'cosToggle',
    template: `
    <div class="toggle_cell" >
        <div class="toggle_widget text_on" ng-click="$ctrl.cosToggle()" ng-class="$ctrl.isEnabled() ? 'on' : 'off'">
            <div class="toggle_circle"></div>
                <div class="toggle_text" ng-if="$ctrl.cosToggleTextOff && !$ctrl.isEnabled()">
                <div class="table_cell">{{$ctrl.cosToggleTextOff}}</div>
            </div>
            <div class="toggle_text" ng-if="$ctrl.cosToggleTextOn && $ctrl.isEnabled()">
                <div class="table_cell">{{$ctrl.cosToggleTextOn}}</div>
            </div>
        </div>
    </div>
    `,
    bindings: {
        model: '=',
        value: '=?',
        offValue: '=?',
        cosToggleTextOn: '=?',
        cosToggleTextOff: '=?',
        cosToggleDatepickerToggle: '=?'
    },
    controller: ['$element', class CosToggleController {
        public model;
        public value;
        public offValue;
        public cosToggleTextOn;
        public cosToggleTextOff;
        public cosToggleDatepickerToggle;

        constructor () {
        }


        cosToggle () {
            if(this.value){
                if(this.model === this.value && this.offValue){
                    this.model = this.offValue;
                } else {
                    this.model = this.value;
                }
            } else {
                this.model = !this.model;
            }
        };

        isEnabled () {
            if(this.value && this.model === this.value) {
                return true;
            } else if (this.value && this.model != this.value) {
                return false;
            } else if (!this.model) {
                return false;
            }

            return true
        }

    }]
}
angular
    .module('citizenos')
    .component(cosToggle.selector, cosToggle);
