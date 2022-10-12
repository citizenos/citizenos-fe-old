'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let activityFeed = {
    selector: 'activityFeed',
    templateUrl: '/views/modals/activity_modal.html',
    bindings: {},
    controller: class ActivityController {
        public activitiesOffset = 0;
        public activitiesLimit = 25;
        public activities = [];
        public filter = 'all';
        public activityfilters = ['all', 'userTopics', 'userGroups', 'user', 'self'];
        private lastViewTime;
        public filer;
        public app;
        public showLoadMoreActivities;

        private sActivity;
        private $translate;
        private ngDialog;

        constructor ($translate, sActivity, ngDialog, AppService) {
            this.app = AppService;
            this.$translate = $translate;
            this.sActivity = sActivity;
            this.ngDialog = ngDialog;

            this.loadActivities(null, null);
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

        loadActivities (offset, limit) {
            const self = this;
            this.activitiesOffset = offset || this.activitiesOffset;
            if (offset === 0) {
                this.activitiesOffset = 0;
            }

            this.activitiesLimit = limit || this.activitiesLimit;
            if (this.activities.length && !offset && !limit) {
                this.activitiesOffset += this.activitiesLimit;
            }

            let filterValue = this.filter;
            if (filterValue === 'all') {
                filterValue = null;
            }

            this.sActivity
                .getActivities(this.activitiesOffset, this.activitiesLimit, filterValue)
                .then((activities) => {
                    self.showLoadMoreActivities = activities.length > 0;
                    self.app.unreadActivitiesCount = 0;
                    activities.forEach((activityGroups, groupKey) => {
                        Object.keys(activityGroups.values).forEach((key) => {
                            var activity = activityGroups.values[key];

                            if (activity.data.type === 'View' && activity.data.object && activity.data.object['@type'] === 'Activity') {
                                if (!self.lastViewTime || activity.updatedAt > self.lastViewTime) {
                                    self.lastViewTime = activity.updatedAt;
                                }
                                activities.splice(groupKey, 1);
                            } else if (!self.lastViewTime || activity.updatedAt > self.lastViewTime) {
                                activity.isNew = '-new';
                            }
                        });
                    });

                    self.activities = self.activities.concat(activities);

                    if (self.activities.length <= 10 && self.showLoadMoreActivities) {
                        self.loadActivities(null, null);
                    }

                });
        };

        filterActivities (filter) {
            this.filter = filter;
            this.activities = [];
            this.loadActivities(0, null);
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

        closeThisDialog (e) {
            const dialog = $(e.target).closest('.ngdialog');
            this.ngDialog.close(dialog.attr('id'), '$closeButton');
        }
    }
}
angular
    .module('citizenos')
    .component(activityFeed.selector, activityFeed);
