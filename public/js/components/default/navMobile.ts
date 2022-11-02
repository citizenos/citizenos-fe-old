import * as angular from 'angular';

let navMobile = {
    selector: 'navMobile',
    templateUrl: '/views/components/default/nav_mobile.html',
    bindings: {},
    controller: ['AppService', 'Topic', class NavController {
        constructor (private app, private Topic) {}
    }]
}

angular
    .module('citizenos')
    .component(navMobile.selector, navMobile);
