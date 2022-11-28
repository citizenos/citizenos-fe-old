'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let activityFeed = {
    selector: 'activityFeed',
    templateUrl: '/views/components/activity_feed.html',
    bindings: {},
    controller: ['$translate', 'sActivity', 'ActivityService', 'ngDialog', 'AppService', class ActivityController {
        public filer;

        constructor (private $translate, private sActivity, private ActivityService, private ngDialog, private app) {
            app.unreadActivitiesCount = 0;
            ActivityService.reload();
        }

        keyCounter (objIn) {
            return Object.keys(objIn).length;
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
    .component(activityFeed.selector, activityFeed);
