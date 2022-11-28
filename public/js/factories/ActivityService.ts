import * as angular from 'angular';

export class ActivityService {
    private page = 1;
    private totalPages = 0;
    public countTotal = 0;
    private isLoading = false;
    private activities = [];
    private limit = 25;
    private offset = 0;
    private hasMore = false;
    private lastViewTime = null;
    public filter = 'all';
    public filters = ['all', 'userTopics', 'userGroups', 'user', 'self'];

    constructor(private sActivity) {
        this.loadActivities();
    };

    getActivity (id) {
        for (var i = 0; i < this.activities.length; i++) {
          const obj = this.activities[i];
          if (obj.id == id) {
            return obj;
          }
        }
    };

    filterActivities (filter) {
        this.filter = filter;
        this.offset = 0;
        this.activities = [];
        this.loadActivities();
    };

    reload () {
        this.offset = 0;
        this.activities = [];
        this.loadActivities();
    };

    loadPage (page) {
        this.page = page;
        this.offset = (page - 1) * this.limit;
        this.loadActivities();
    };

    loadActivities() {
        if (!this.isLoading) {
            this.isLoading = true;
            let filterValue = this.filter;
            if (filterValue === 'all') {
                filterValue = null;
            }
            this.sActivity
                .getActivities(this.offset, this.limit, filterValue)
                .then((activities) => {
                    this.hasMore = activities.length > 0;
                    activities.forEach((activityGroups, groupKey) => {
                        Object.keys(activityGroups.values).forEach((key) => {
                            var activity = activityGroups.values[key];

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

                    if (this.activities.length <= 10 && this.hasMore) {
                        this.loadActivities();
                    }

                    this.isLoading = false;
            });
        }
    }

    loadMore () {
        if (!this.isLoading) {
            this.page += 1;
            this.loadPage(this.page);
        }
    }
};

angular
  .module("citizenos")
  .service("ActivityService", ['sActivity', ActivityService]);
