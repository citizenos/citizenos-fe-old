import * as angular from 'angular';

let nav = {
    selector: 'nav',
    templateUrl: '/views/components/default/nav.html',
    bindings: {},
    controller: ['AppService', class NavController {
        constructor (private app) {}
    }]
}

angular
    .module('citizenos')
    .component(nav.selector, nav);
