import * as angular from 'angular';

let navMobile = {
    selector: 'navMobile',
    templateUrl: '../../views/default/nav_mobile.html',
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
    .component(navMobile.selector, navMobile);
