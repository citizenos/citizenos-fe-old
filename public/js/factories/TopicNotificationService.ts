import * as angular from 'angular';

export class TopicNotificationService {
    private page = 1;
    private totalPages = 0;
    public countTotal = 0;
    private isLoading = false;
    private isSaving = false;
    private topics = [];
    private search = null;
    private orderBy = 'name';
    private order = 'ASC';
    private limit = 10;
    private offset = 0;

    constructor(private TopicNotification) {
        this.loadTopics();
    }
    getTopicMemberUser (id) {
        for (var i = 0; i < this.topics.length; i++) {
          const obj = this.topics[i];
          if (obj.id == id) {
            return obj;
          }
        }
      }
    doSearch () {
        this.page = 1;
        this.topics = [];
        this.loadTopics();
    }
    doOrder(orderBy, order?) {
        this.page = 1;
        this.orderBy = orderBy;
        if (!order && this.order === 'ASC') {
            this.order = 'DESC';
        } else {
            this.order = 'ASC';
        }
        this.topics = [];
        this.loadTopics();
    }
    reload () {
        this.topics = [];
        this.loadTopics();
    }
    loadPage (page) {
        this.page = page;
        this.offset = (page - 1) * this.limit;
        this.loadTopics();
    }
    loadTopics() {
        this.countTotal = 0;
        this.totalPages = 0;
        this.topics = [];
        if (!this.isLoading) {
            this.isLoading = true;
            let params = {
                offset: this.offset,
                order: this.orderBy,
                sortOrder: this.order,
                limit: this.limit
            }
            if (this.search) {
                params['search'] = this.search;
            }
            this.TopicNotification.query(params).then((data) => {
                this.countTotal = data.count || 0;
                this.totalPages = Math.ceil(data.count / this.limit);
                this.topics = data.rows;

                this.isLoading = false;
            });
        }
    }

    loadMore () {
        if (!this.isLoading) {
            this.page += 1;
            this.loadTopics();
        }
    }
};

angular
  .module("citizenos")
  .service("TopicNotificationService", ['TopicNotification', TopicNotificationService]);
