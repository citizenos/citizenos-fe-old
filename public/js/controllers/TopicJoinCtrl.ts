'use strict';
import * as angular from 'angular';

export class TopicJoinController {
    constructor (private $state, private $stateParams, private $log, private Topic) {
        Topic
            .getByToken({
                token: $stateParams.token,
                __doNotDisplayErrors: true
            })
            .then((topic) => { // IF IT RETURNS, it is a PUBLIC topic and send straight to the Topic view - https://github.com/citizenos/citizenos-fe/issues/405#issuecomment-943336961
                return $state.go('topics/view', {
                    topicId: topic.id
                });
            }, (err) => {
                // IT does not exist or the Topic is PRIVATE and requires login
                return Topic.join({
                    token: $stateParams.token
                });
            }
            )
            .then((res) => {
                if (res && res.data) {
                    $state.go('topics/view', {
                        topicId: res.data.id
                    });
                }
            }, (res) => {
                const status = res.data.status;
                if (status.code === 40100) { // Unauthorized
                    const currentUrl = $state.href($state.current.name, $stateParams);
                    $state.go('account/login', {redirectSuccess: currentUrl});
                } else if (status.code === 40001) { // Matching token not found.
                    $state.go('home');
                } else {
                    $log.error('Failed to join Topic', res);
                }
            });
    }
};

angular
    .module('citizenos')
    .controller('TopicJoinController', ['$state', '$stateParams', '$log', 'Topic', TopicJoinController]);
