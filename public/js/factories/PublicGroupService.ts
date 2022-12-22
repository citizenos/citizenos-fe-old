import * as angular from 'angular';

export class PublicGroupService {
    private countTotal = 0;
    private page = 1;
    private isLoading = false;
    private groups = [];
    private search = null;
    private orderBy = 'name';
    private order = 'ASC';
    private offset = 0;
    public limit = 8;

    constructor(private PublicGroup) {
        this.loadGroups();
    }
    getGroup (id) {
        for (var i = 0; i < this.groups.length; i++) {
          const obj = this.groups[i];
          if (obj.id == id) {
            return obj;
          }
        }
      }
    doSearch () {
        this.offset = 0;
        this.page = 1;
        this.groups = [];
        this.loadGroups();
    }
    doOrder() {
        this.offset = 0;
        this.page = 1;
        this.groups = [];
        this.loadGroups();
    }
    reload () {
        this.offset = 0;
        this.page = 1;
        this.groups = [];
        this.loadGroups();
    }
    loadPage (page) {
        this.page = page;
        this.offset = (page - 1) * this.limit;
        this.groups = [];
        this.loadGroups();
    }
    loadGroups() {
        if (!this.isLoading) {
            this.isLoading = true;

            let params = {
              page: this.page,
              orderBy: this.orderBy,
              order: this.order,
              str: this.search,
              offset: this.offset,
              limit: this.limit
            };

            this.PublicGroup.query(params).then((res) => {
                if (res.data.data.countTotal) {
                    this.countTotal = res.data.data.countTotal;
                    for (let group of res.data.data.rows) {
                        this.groups.push(group);
                    }
                }
              this.isLoading = false;
            });
        }
    }

    loadMore () {
        if (!this.isLoading) {
            this.page += 1;
            this.offset = (this.page - 1) * this.limit;
            this.loadGroups();
        }
    }
};

angular
  .module("citizenos")
  .service("PublicGroupService", ['PublicGroup', PublicGroupService]);
