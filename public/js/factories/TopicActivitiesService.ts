import * as angular from 'angular';

export class TopicActivitiesService {
    private isLoading = false;
    private activities = [];
    private limit = 10;
    private offset = 0;
    private lastViewTime = null;
    private topicId = null;

    constructor(private sActivity) {
        this.loadActivities();
    }
    getTopicActivity (id) {
        for (var i = 0; i < this.activities.length; i++) {
          const obj = this.activities[i];
          if (obj.id == id) {
            return obj;
          }
        }
    }

    reload () {
        this.offset = 0;
        this.activities = [];
        this.loadActivities();
    }
    loadActivities() {
        if (this.offset === 0) {
            this.activities = [];
        }
        if (!this.isLoading && this.topicId) {
            this.isLoading = true;
            this.sActivity.getTopicActivities(this.topicId, this.offset, this.limit).then((activities) => {
                activities.forEach((activityGroups, groupKey) => {
                    Object.keys(activityGroups.values).forEach((key) => {
                        const activity = activityGroups.values[key];

                        if (activity.data.type === 'View' && activity.data.object && activity.data.object['@type'] === 'Activity') {
                            if (!this.lastViewTime || activity.updatedAt > this.lastViewTime) {
                                this.lastViewTime = activity.updatedAt;
                            }
                            activities.splice(groupKey, 1);
                        } else if (!this.lastViewTime || activity.updatedAt > this.lastViewTime) {
                            activity.isNew = '-new';
                        }
                    });
                });

                this.activities = this.activities.concat(activities);
                this.isLoading = false;
            });
        }
    }

    loadMore () {
        if (!this.isLoading) {
            if (this.activities.length) {
                this.offset += this.limit;
            }
            this.loadActivities();
        }
    }
};

angular
  .module("citizenos")
  .service("TopicActivitiesService", ['sActivity', TopicActivitiesService]);