import * as angular from 'angular';

export class TopicService {
    private page = 1;
    private hasMore = true;
    private isLoading = false;
    private topics = [];
    private search = null;
    private orderBy = 'name';
    private order = 'ASC';

    private filters = {
        prefix: null,
        userId: null,
        visibility: null,
        hasVoted: null,
        creatorId: null,
        statuses: null,
        pinned: null,
        showModerated: null
    }

    constructor(private Topic, private sAuth) {
        this.loadTopics();
    }
    getGroup (id) {
        for (var i = 0; i < this.topics.length; i++) {
          const obj = this.topics[i];
          if (obj.id == id) {
            return obj;
          }
        }
      }
    doSearch () {
        this.hasMore = true;
        this.page = 1;
        this.topics = [];
        this.loadTopics();
    }
    doOrder() {
        this.hasMore = true;
        this.page = 1;
        this.topics = [];
        this.loadTopics();
    }
    reload () {
        this.topics = [];
        this.loadTopics();
    }
    clearFilters () {
        this.filters = {
            prefix: null,
            userId: null,
            visibility: null,
            hasVoted: null,
            creatorId: null,
            statuses: null,
            pinned: null,
            showModerated: null
        };
        this.reload();
    }
    filterTopics (filter) {
        this.filters = {
            prefix: null,
            userId: null,
            visibility: null,
            hasVoted: null,
            creatorId: null,
            statuses: null,
            pinned: null,
            showModerated: null
        };
        if (this.Topic.STATUSES[filter]) {
            this.filters.statuses = filter;
        } else if(this.Topic.VISIBILITY[filter]) {
            this.filters.visibility = filter;
        } else {
            switch (filter) {
                case 'all':
                    break;
                case 'haveVoted':
                    this.filters.hasVoted = true;
                    break;
                case 'haveNotVoted':
                    this.filters.hasVoted = false;
                    break;
                case 'iCreated':
                    this.filters.creatorId = this.sAuth.user.id;
                    break;
                case 'pinnedTopics':
                    this.filters.pinned = true;
                    break;
                case 'showModerated':
                    this.filters.showModerated = true;
                    break;
            };
        }
        this.reload();
    }
    loadTopics () {
        if (this.hasMore && !this.isLoading) {
            this.isLoading = true;

            let params = {
              page: this.page,
              orderBy: this.orderBy,
              order: this.order,
              str: this.search
            };
            if (this.sAuth.user.loggedIn) {
                Object.assign(this.filters, {prefix: 'users', userId: 'self'});
            }
            Object.assign(params, this.filters);

            this.Topic
                .query(params)
                .$promise.then((topics) => {
                    this.topics = topics;
                    this.isLoading = false;
                });
        }
    }

    loadMore () {
        if (this.hasMore && !this.isLoading) {
            this.page += 1;
            this.loadTopics();
        }
    }
};

angular
  .module("citizenos")
  .service("TopicService", ['Topic', 'sAuth', TopicService]);