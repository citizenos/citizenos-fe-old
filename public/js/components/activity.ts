'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let activity = {
    selector: 'activity',
    templateUrl: '/views/components/activity.html',
    bindings: {
        item: '='
    },
    controller: ['$translate', 'sActivity', 'ngDialog', 'AppService', class ActivityController {
        public activityfilters = ['all', 'userTopics', 'userGroups', 'user', 'self'];
        private activity;

        constructor (private $translate, private sActivity, private ngDialog, private app) {}

        keyCounter (objIn) {
            if (typeof objIn === 'object') {
                return Object.keys(objIn).length;
            }

            return objIn?.length;
        };

        getGroupItems (values) {
            const returnArray = [];
            Object.keys(values).forEach((key) => {
                returnArray.push(values[key]);
            });

            return returnArray;
        };

        showActivityDescription (activity) {
            return this.sActivity.showActivityDescription(activity);
        };

        showActivityUpdateVersions (activity) {
            return this.sActivity.showActivityUpdateVersions(activity);
        };

        activityRedirect (activity) {
            return this.sActivity.handleActivityRedirect(activity);
        };

        translateGroup (key, group) {
            const values = group[0].values;
            values.groupCount = group.length;
            if (key.indexOf('USERACTIVITYGROUP') === -1) {
                values.groupCount--;
            }

            return this.$translate.instant(key.split(':')[0], values);
        };
    }]
};

angular
    .module('citizenos')
    .component(activity.selector, activity);
