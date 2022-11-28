'use strict';
import * as angular from 'angular';

let activitiesWidget = {
    selector: 'activitiesWidget',
    templateUrl: '/views/widgets/activities.html',
    bindings: {},
    controller: ['$state', '$stateParams', '$window', '$log', '$translate', 'sActivity', 'AppService', class ActivitiesWidgetController {
        private activities;

        constructor ($state, private $stateParams, private $window, $log, private $translate, private sActivity, private app) {
            $log.debug('ActivitiesWidgetController');

            switch ($state.current.name) {
                case 'widgets/topicActivities':
                    sActivity.getTopicActivitiesUnauth($stateParams.topicId)
                    .then((activities) => this.activities = activities);
                    break;
                case 'widgets/partnerActivities':
                    sActivity.getActivitiesUnauth(0, 50, null, $stateParams.filter, $stateParams.partnerId)
                    .then((activities) => this.activities = activities);
                break;
                default:
                    sActivity.getActivitiesUnauth(0, 100)
                        .then((activities) => this.activities = activities);
            }
            //$scope.activities = ActivitiesResolve;
        }

        showActivityDescription (activity) {
            return this.sActivity.showActivityDescription(activity);
        };

        showActivityUpdateVersions (activity) {
            return this.sActivity.showActivityUpdateVersions(activity);
        };

        onClick (activity) {
            let topic;

            const activityData = activity.data;
            const activityTarget = activityData.target;
            const activityObject = activityData.object;


            if (activityTarget && activityTarget['@type'] === 'Topic') {
                topic = activityTarget;
            } else if (activityObject && activityObject['@type'] === 'Topic') {
                topic = activityObject;
            }

            if (topic) {
                this.widgetPostMessage({
                    click: {
                        topic: topic
                    }
                });
            }
        };

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

        translateGroup (key, group) {
            const values = group[0].values;
            values.groupCount = group.length;

            return this.$translate.instant(key.split(':')[0], values);
        };

        widgetPostMessage (data) {
            if (this.$window.self !== this.$window.parent) {
                var msg = {citizenos: {}};
                msg.citizenos['widgets'] = {};
                msg.citizenos['widgets'][this.$stateParams.widgetId] = data;
                this.$window.top.postMessage(msg, '*');
            } else {
                // SKIP, as not in a frame
            }
        }
    }]
};

angular
    .module('citizenos')
    .component(activitiesWidget.selector, activitiesWidget);