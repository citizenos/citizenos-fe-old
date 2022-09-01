'use strict';
import * as angular from 'angular';
import * as moment from 'moment';
import * as _ from 'lodash';

angular
    .module('citizenos')
    .controller('TopicVoteCreateCtrl', ['$scope', '$state', '$log', 'sNotification', 'Vote', function ($scope, $state, $log, sNotification, Vote) {
        $log.debug('TopicVoteCreateCtrl');

    }]);
