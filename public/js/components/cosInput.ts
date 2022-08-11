import * as angular from 'angular';
let cosInput = {
    selector: 'cosInput',
    template: `<div class="input_wrap"><input ng-model="$ctrl.item"></div>`,
    bindings: {
        item: '=cosInput'
    },
    controller: class CosInputController {
        private item;
        constructor () {}
    }
}
angular
    .module('citizenos')
    .component(cosInput.selector, cosInput);
