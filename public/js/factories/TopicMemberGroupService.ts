import * as angular from 'angular';

export class TopicMemberGroupService {
    private page = 1;
    private totalPages = 0;
    public countTotal = 0;
    private isLoading = false;
    private isSaving = false;
    private groups = [];
    private search = null;
    private orderBy = 'name';
    private order = 'ASC';
    private limit = 10;
    private offset = 0;
    private topicId = null;

    constructor(private TopicMemberGroup) {
        this.loadGroups();
    }
    getTopicMemberUser (id) {
        for (var i = 0; i < this.groups.length; i++) {
          const obj = this.groups[i];
          if (obj.id == id) {
            return obj;
          }
        }
    }
    doSearch () {
        this.page = 1;
        this.groups = [];
        this.loadGroups();
    }
    doOrder(orderBy, order?) {
        this.page = 1;
        this.orderBy = orderBy;
        if (!order && this.order === 'ASC') {
            this.order = 'DESC';
        } else {
            this.order = 'ASC';
        }
        this.groups = [];
        this.loadGroups();
    }
    reload () {
        this.groups = [];
        this.loadGroups();
    }
    loadPage (page) {
        this.page = page;
        this.offset = (page - 1) * this.limit;
        this.loadGroups();
    }
    loadGroups() {
        this.countTotal = 0;
        this.totalPages = 0;
        this.groups = [];
        if (!this.isLoading && this.topicId) {
            this.isLoading = true;
            let params = {
                topicId: this.topicId,
                offset: this.offset,
                search: this.search,
                order: this.orderBy,
                sortOrder: this.order,
                limit: this.limit
            }
            this.TopicMemberGroup.query(params).$promise.then((groups) => {
                if (groups.length) {
                    this.countTotal = groups[0].countTotal || 0;
                    this.totalPages = Math.ceil(groups[0].countTotal / this.limit);
                }
                for (let group of groups) {
                    this.groups.push(group);
                }
                this.isLoading = false;
            });
        }
    }

    loadMore () {
        if (this.isLoading) {
            this.page += 1;
            this.loadGroups();
        }
    }
};

angular
  .module("citizenos")
  .service("TopicMemberGroupService", ['TopicMemberGroup', TopicMemberGroupService]);