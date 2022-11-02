import * as angular from 'angular';

let topicTabs = {
    selector: 'topicTabs',
    templateUrl: '/views/components/topic/topic_tabs.html',
    bindings: {
        topicId: '=',
        voteId: '=',
        status: '='
    },
    controller: ['$log', 'Topic', class TopicTabsController {
        public trainPosition;
        private tabFinalLength;
        public tabsTrainWidth;
        public tabsVisibleAreaWidth;
        public STATUSES;

        constructor ($log, Topic) {
            $log.debug('TopicTabs');
            this.STATUSES = Topic.STATUSES;
        };

        moveLeft () {
            if (this.trainPosition < -this.tabFinalLength) {
                this.trainPosition += this.tabFinalLength;
            } else {
                this.trainPosition = 0;
            }
        };

        //When right arrow is clicked move the tabs train to right
        moveRight () {
            if (this.trainPosition > -this.tabsTrainWidth + this.tabsVisibleAreaWidth - 10) {
                this.trainPosition -= this.tabFinalLength;
            }

            //If end of the line
            if (this.trainPosition < -this.tabsTrainWidth + this.tabsVisibleAreaWidth - 10) {
                this.trainPosition = -this.tabsTrainWidth + this.tabsVisibleAreaWidth - 10;
            }
        }

    }]
};

angular
    .module('citizenos')
    .component(topicTabs.selector, topicTabs);

