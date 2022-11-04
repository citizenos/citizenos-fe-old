import * as angular from 'angular';

export class TopicAttachmentService {
    private isLoading = false;
    private count = 0;
    private attachments = [];
    private topicId = null;

    constructor(private TopicAttachment, private sAuth) {
        this.loadAttachments();
    }

    reload () {
        this.attachments = [];
        this.loadAttachments();
    }

    loadAttachments () {
        if (!this.isLoading && this.topicId) {
            this.isLoading = true;

            this.TopicAttachment
                .query({topicId: this.topicId})
                .then((data) => {
                    this.attachments = data.rows;
                    this.count = data.count;
                    this.isLoading = false;
                });
        }
    }

};

angular
  .module("citizenos")
  .service("TopicAttachmentService", ['TopicAttachment', 'sAuth', TopicAttachmentService]);