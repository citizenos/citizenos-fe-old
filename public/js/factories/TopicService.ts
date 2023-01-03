import * as angular from 'angular';

export class TopicService {
    private page = 1;
    private countTotal = 0;
    private totalPages = 0;
    private hasMore = true;
    private isLoading = false;
    private topics = [];
    private search = null;
    private orderBy = 'title';
    private order = 'ASC';
    private limit = 10;
    private offset = 0;

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
        //this.loadTopics();
    }
    getGroup (id) {
        for (var i = 0; i < this.topics.length; i++) {
          const obj = this.topics[i];
          if (obj.id == id) {
            return obj;
          }
        }
      }
    doSearch (str) {
        this.hasMore = true;
        this.page = 1;
        this.topics = [];
        this.offset = 0;
        this.search = str;
        return this.loadTopics();
    }
    doOrder(orderBy, order?) {
        this.hasMore = true;
        this.page = 1;
        this.offset = 0;
        this.topics = [];
        this.orderBy = orderBy;
        if (!order && this.order === 'ASC') {
            this.order = 'DESC';
        } else {
            this.order = 'ASC';
        }
        return this.loadTopics();
    }
    reload () {
        this.search = null;
        this.offset = 0;
        this.page = 1;
        this.topics = [];
        return this.loadTopics();
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
        return this.reload();
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
        return this.reload();
    }
    loadTopics () {
        this.countTotal = 0;
        this.totalPages = 0;
        if (this.hasMore && !this.isLoading) {
            this.isLoading = true;

            let params = {
              page: this.page,
              orderBy: this.orderBy,
              order: this.order
            };
            if (this.sAuth.user.loggedIn) {
                Object.assign(this.filters, {prefix: 'users', userId: 'self'});
            }
            if (this.search) {
              params['str'] = this.search;
            }
            Object.assign(params, this.filters);

            return this.Topic
                .query(params)
                .then((data) => {
                    this.countTotal = data.count;
                    this.totalPages = Math.ceil(data.count / this.limit);
                    this.topics = data.rows;
                    this.isLoading = false;
                });
        }
    }

    loadMore () {
        if (this.hasMore && !this.isLoading) {
            this.page += 1;
            return this.loadTopics();
        }
    }
};

angular
  .module("citizenos")
  .service("TopicService", ['Topic', 'sAuth', TopicService]);
