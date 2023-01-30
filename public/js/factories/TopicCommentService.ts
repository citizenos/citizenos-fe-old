import * as angular from 'angular';

export class TopicCommentService {
    private page = 1;
    private totalPages = 0;
    public countTotal = 0;
    private isLoading = false;
    private comments = [];
    private orderBy = 'date';
    private order = 'ASC';
    private limit = 10;
    private offset = 0;
    private topicId = null;
    private hasMore = true;
    private count = {
        pro: 0,
        con: 0,
        poi: 0,
        reply: 0
    }

    constructor(private TopicComment) {
        this.loadComments();
    }
    getTopicMemberUser (id) {
        for (var i = 0; i < this.comments.length; i++) {
          const obj = this.comments[i];
          if (obj.id == id) {
            return obj;
          }
        }
      }
    doSearch () {
        this.page = 1;
        this.comments = [];
        this.loadComments();
    }
    doOrder(orderBy, order?) {
        this.page = 1;
        this.orderBy = orderBy;
        console.log(this.orderBy)
        if (!order && this.order === 'ASC') {
            this.order = 'DESC';
        } else {
            this.order = 'ASC';
        }
        this.comments = [];
        this.loadComments();
    }
    reload () {
        this.comments = [];
        this.loadComments();
    }
    loadPage (page) {
        this.page = page;
        this.offset = (page - 1) * this.limit;
        this.loadComments();
    }
    loadComments() {
        this.countTotal = 0;
        this.totalPages = 0;
        this.comments = [];
        if (!this.isLoading && this.topicId) {
            this.isLoading = true;
            let params = {
                topicId: this.topicId,
                offset: this.offset,
                orderBy: this.orderBy,
                sortOrder: this.order,
                limit: this.limit
            }
            this.TopicComment.query(params).then((data) => {
                this.count = data.count;
                this.countTotal = data.count.total || 0;
                this.totalPages = Math.ceil((this.countTotal-data.count.reply) / this.limit);
                if (data.rows.length < this.limit) {
                    this.hasMore = false;
                }
                this.comments = data.rows;

                this.isLoading = false;
            });
        }
    }

    loadMore () {
        if (!this.isLoading) {
            this.page += 1;
            this.loadComments();
        }
    }
};

angular
  .module("citizenos")
  .service("TopicCommentService", ['TopicComment', TopicCommentService]);
