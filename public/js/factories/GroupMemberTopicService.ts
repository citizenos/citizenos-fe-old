import * as angular from 'angular';

export class GroupMemberTopicService {
    private page = 1;
    private totalPages = 0;
    public countTotal = 0;
    private isLoading = false;
    private isSaving = false;
    private topics = [];
    private search = null;
    private orderBy = 'title';
    private order = 'ASC';
    private limit = 10;
    private offset = 0;
    private groupId = null;

    constructor(private GroupMemberTopic) {
        this.loadTopics();
    }
    getGroupMemberTopic (id) {
        for (var i = 0; i < this.topics.length; i++) {
          const obj = this.topics[i];
          if (obj.id == id) {
            return obj;
          }
        }
    }
    doSearch () {
        console.log(this.search);
        this.offset = 0;
        this.page = 1;
        this.topics = [];
        this.loadTopics();
    }
    doOrder(orderBy, order?) {
        this.offset = 0;
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
        this.offset = 0;
        this.page = 1;
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
        if (!this.isLoading && this.groupId) {
            this.isLoading = true;
            let params = {
                groupId: this.groupId,
                offset: this.offset,
                order: this.orderBy,
                sortOrder: this.order,
                limit: this.limit
            }
            if (this.search) {
                params['search'] = this.search
            }
            this.GroupMemberTopic.query(params).then((res) => {
                this.countTotal = res.countTotal || 0;
                this.totalPages = Math.ceil(res.countTotal / this.limit);
                this.topics = res.rows;
                this.isLoading = false;
            });
        }
    }

    loadMore () {
        if (this.isLoading) {
            this.page += 1;
            this.loadTopics();
        }
    }
};

angular
  .module("citizenos")
  .service("GroupMemberTopicService", ['GroupMemberTopic', GroupMemberTopicService]);
