import * as angular from 'angular';

let nav = {
    selector: 'nav',
    templateUrl: '../../views/default/nav.html',
    bindings: {},
    controller: ['AppService', class NavController {
        public sapp;

        constructor (AppService) {
            this.sapp = AppService;
        }
    }]
}

angular
    .module('citizenos')
    .component(nav.selector, nav);
