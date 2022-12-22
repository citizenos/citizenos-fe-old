import * as angular from 'angular';

export class PublicTopicService {
    private countTotal = 0;
    private page = 1;
    private isLoading = false;
    private topics = [];
    private search = null;
    private orderBy = 'name';
    private order = 'ASC';
    private offset = 0;
    public limit = 8;
    private statuses;
    private showModerated;
    private categories;

    constructor(private Topic) {
        this.loadTopics();
    }

    getTopic (id) {
        for (var i = 0; i < this.topics.length; i++) {
          const obj = this.topics[i];
          if (obj.id == id) {
            return obj;
          }
        }
    }

    doSearch () {
        this.offset = 0;
        this.page = 1;
        this.topics = [];
        this.loadTopics();
    }
    doOrder() {
        this.offset = 0;
        this.page = 1;
        this.topics = [];
        this.loadTopics();
    }
    reload () {
        this.offset = 0;
        this.page = 1;
        this.topics = [];
        this.loadTopics();
    }
    loadPage (page) {
        this.page = page;
        this.offset = (page - 1) * this.limit;
        this.topics = [];
        this.loadTopics();
    }
    loadTopics() {
        if (!this.isLoading) {
            this.isLoading = true;

            let params = {
                statuses: this.statuses,
                categories: this.categories,
                showModerated: this.showModerated,
                page: this.page,
                orderBy: this.orderBy,
                order: this.order,
                offset: this.offset,
                limit: this.limit
            };
            if (this.search) {
                params['str'] = this.search;
            }
            this.Topic.queryPublic(params).then((data) => {
            this.countTotal = data.countTotal;
            for (let topic of data.rows) {
                this.topics.push(topic);
            }
              this.isLoading = false;
            });
        }
    }

    loadMore () {
        if (!this.isLoading) {
            this.page += 1;
            this.offset = (this.page - 1) * this.limit;
            this.loadTopics();
        }
    }
};

angular
  .module("citizenos")
  .service("PublicTopicService", ['Topic', PublicTopicService]);
