import * as angular from 'angular';

let topicTimeline = {
    selector: 'topicTimeline',
    templateUrl: '/views/components/topic/topic_timeline.html',
    bindings: {
        voteEndsAt: '=',
        status: '='
    },
    controller: ['$log', 'Topic', class TopicTimelineController {
        public status;
        public STATUSES;
        private Topic;

        constructor ($log, Topic, AppService) {
            $log.debug('TopicTimeline')
            this.STATUSES = Topic.STATUSES;
        };

        isValidStatus (index) {
            const statusesArray = Object.values(this.STATUSES).reverse().splice(0, index);
            return statusesArray.indexOf(this.status) > -1;
        };
    }]
};

angular
    .module('citizenos')
    .component(topicTimeline.selector, topicTimeline);

