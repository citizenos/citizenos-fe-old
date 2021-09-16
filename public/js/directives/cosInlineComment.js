angular
    .module('citizenos')
    .directive('cosInlineComment', ['Topic', '$translate', function (Topic, $translate) {
        return {
          restrict: 'A',
          replace: false,
          link: function (scope, element, attrs) {
            attrs.$addClass('inline-comment');
            var t = new Topic({id: attrs.cosInlineComment});
            t.$getInlineComments()
                .then(function(comments) {
                    scope.comments = comments;
                });

            element.on('click', function () {
                //will remove existing elements
                var childElems = element.parent().children();
                for(var i = 0; i < childElems.length; i++) {
                    var child = angular.element(childElems[i]);
                    if (child.hasClass('comment-popup')) {
                        child.remove();
                    }
                };
                //get the current element position top place the popup in correct position
                var top = element[0].offsetTop + element[0].offsetHeight;
                var left = element[0].offsetLeft;
                var comment = scope.comments[attrs.comment];
                console.log(comment);
                var createdAt = moment(comment.timestamp).fromNow();
                var commentRepliesbox = '';
                if (comment.replies) {
                    commentRepliesbox = '<div class="comment-reply"> \
                        <div class="comment-replies-container"> ';
                    comment.replies.forEach(function (reply) {
                        commentRepliesbox += '<div class="sidebar-comment-reply comment-container "> \
                            <span class="comment-author-name">'+reply.name+'</span> \
                            <span class="comment-created-at" datetime="2021-06-30T12:05:16.878Z">'+moment(reply.timestamp).fromNow()+'</span> \
                            <div class="comment-reply-value-wrapper"> \
                                <span class="comment-text">'+reply.text+'</span> \
                            </div>';

                        if (reply.changeFrom) {
                            var suggestText = $translate.instant('VIEWS.TOPICS_TOPICID.INLINE_COMMENT_SUGGEST_CHANGE', {
                                changeTo: reply.changeTo,
                                changeFrom: reply.changeFrom
                            });
                            commentRepliesbox += '<div> \
                                    <span class="from-label">'+suggestText+'</span> \
                                </div>';
                        }

                        commentRepliesbox += '</div> \
                        </div>';
                    });
                    commentRepliesbox +='</div> \
                    </div>'
                }
                var commentSuggest = '';
                if (comment.changeFrom) {
                    var commentSuggest = $translate.instant('VIEWS.TOPICS_TOPICID.INLINE_COMMENT_SUGGEST_CHANGE', {
                        changeTo: comment.changeTo,
                        changeFrom: comment.changeFrom
                    });
                }
                var commentbox = angular.element('<div class="comment-popup"><div class="comment-popup-content"><div class="comment-header"><span class="comment-author-name">'+comment.name+'</span><span class="comment-created-at" datetime="'+createdAt+'">'+createdAt+'</span></div><div class="comment-text">'+comment.text+'</div>'+commentSuggest+'</div>'+commentRepliesbox+'</div>');
                element.after(commentbox);
                commentbox[0].style.position = "absolute";
                commentbox[0].style.left = left + 'px';
                commentbox[0].style.top = top + 'px';
                commentbox.on('click', function () {
                    commentbox.remove();
                });
            });
          }
        };
      }]);
