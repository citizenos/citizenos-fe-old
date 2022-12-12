import * as angular from 'angular';

export class PublicGroupMemberTopicService {
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
            this.GroupMemberTopic.queryPublic(params).then((res) => {
                if (res.countTotal) {
                    this.countTotal = res.countTotal || 0;
                    this.totalPages = Math.ceil(res.countTotal / this.limit);
                }
                for (let topic of res.rows) {
                    this.topics.push(topic);
                }
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
  .service("PublicGroupMemberTopicService", ['GroupMemberTopic', PublicGroupMemberTopicService]);
