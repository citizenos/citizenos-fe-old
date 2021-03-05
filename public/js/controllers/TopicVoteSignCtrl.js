'use strict';

angular
    .module('citizenos')
    .controller('TopicVoteSignCtrl', ['$scope', '$log', '$q', '$timeout', 'hwcrypto', 'ngDialog', 'sNotification', 'sAuth', 'TopicVote', function ($scope, $log, $q, $timeout, hwcrypto, ngDialog, sNotification, sAuth, TopicVote) {
        $log.debug('TopicVoteSignCtrl', $scope.ngDialogData);

        var topic = $scope.ngDialogData.topic;
        var options = $scope.ngDialogData.options;

        $scope.formMobile = {
            pid: null,
            phoneNumber: null,
            challengeID: null,
            isLoading: false
        };
        $scope.formSmartId = {
            pid: null,
            countryCode: 'EE',
            challengeID: null,
            isLoading: false
        };
        $scope.challengeID = null;
        $scope.isLoadingIdCard = false;

        // TODO: Multiple choice support some day... - https://trello.com/c/WzECsxck/280-bug-vote-sign-no-multiple-choice-support
        $scope.optionsSelected = _.map(options, function (option) {
            return { value: option.value, optionId: option.id };
        });

        $scope.doSignWithCard = function () {
            $scope.isLoadingIdCard = true;

            hwcrypto
                .getCertificate({})
                .then(function (certificate) {
                    var userVote = new TopicVote({id: topic.vote.id, topicId: topic.id});
                    userVote.options =  $scope.optionsSelected;
                    userVote.certificate = certificate.hex;
                    return $q.all([certificate, userVote.$save()]);
                })
                .then(function (results) {
                    var certificate = results[0];
                    var voteResponse = results[1];

                    var signedInfoDigest = voteResponse.signedInfoDigest;
                    var signedInfoHashType = voteResponse.signedInfoHashType;
                    var token = voteResponse.token;

                    return $q.all([
                        hwcrypto.sign(certificate, {hex: signedInfoDigest, type: signedInfoHashType}, {}),
                        token
                    ]);
                })
                .then(function (results) {
                    var signature = results[0];
                    var token = results[1];

                    var signTopicVote = new TopicVote({id: topic.vote.id, topicId: topic.id});
                    signTopicVote.signatureValue = signature.hex;
                    signTopicVote.token = token;
                    return signTopicVote.$sign();
                })
                .then(function (voteSignResult) {
                    ngDialog.closeAll({ // Pass Vote options, so we can show selected option for the unauthenticated User
                        options:  $scope.optionsSelected,
                        bdocUri: voteSignResult.data.bdocUri
                    });
                }, function (err) {
                    $scope.isLoadingIdCard = false;

                    var msg = null;
                    if (err instanceof Error) { //hwcrypto and JS errors
                        msg = hwCryptoErrorToTranslationKey(err);
                    } else { // API error response
                        msg = err.status.message;
                    }

                    $scope.$apply(sNotification.addError(msg));
                });
        };

        $scope.doSignWithMobile = function () {
            $log.debug('doSignWithMobile()');

            $scope.formMobile.isLoading = true;

            var userVote = new TopicVote({id: topic.vote.id, topicId: topic.id});
            userVote.options =  $scope.optionsSelected;
            userVote.pid = $scope.formMobile.pid;
            userVote.certificate = null;
            userVote.phoneNumber = $scope.formMobile.phoneNumber;
            $scope.formMobile.challengeID = null;

            userVote.$save()
                .then(function (voteInitResult) {
                    $log.debug('voteInitResult', voteInitResult);
                    $scope.challengeID = voteInitResult.challengeID;
                    $scope.formMobile.challengeID = voteInitResult.challengeID;
                    var token = voteInitResult.token;
                    return pollVoteMobileSignStatus(topic.id, topic.vote.id, token, 3000, 80);
                })
                .then(function (voteStatusResult) {
                    $log.debug('voteVoteSign succeeded', arguments);
                    ngDialog.closeAll({ // Pass Vote options, so we can show selected option for the unauthenticated User
                        options:  $scope.optionsSelected,
                        bdocUri: voteStatusResult.bdocUri
                    });
                }, function (err) {
                    $scope.formMobile.isLoading = false;
                });
        };

        var pollVoteMobileSignStatus = function (topicId, voteId, token, milliseconds, retry) {
            if (!retry) retry = 80;
            if (!retry--) throw new Error('Too many retries');

            var voteStatusPromise = TopicVote.status({topicId: topic.id, voteId: topic.vote.id, prefix: sAuth.getUrlPrefix(), userId: sAuth.getUrlUserId(), token: token}).$promise

            return voteStatusPromise
                .then(function (response) {
                    var statusCode = response.status.code;
                    switch (statusCode) {
                        case 20001:
                            return $timeout(function () {
                                return pollVoteMobileSignStatus(topicId, voteId, token, milliseconds, retry);
                            }, milliseconds, false);
                        case 20002:
                            // Done
                            return response.data;
                        default:
                            $log.error('Mobile signing failed', response);
                            return $q.defer().reject(response);
                    }
                });
        };

        $scope.doSignWithSmartId = function () {
            $log.debug('doSignWithSmartId()');
            $scope.formSmartId.isLoading = true;

            var userVote = new TopicVote({id: topic.vote.id, topicId: topic.id});
            userVote.options =  $scope.optionsSelected;
            userVote.pid = $scope.formSmartId.pid;
            userVote.certificate = null;
            userVote.phoneNumber = null;
            userVote.countryCode = $scope.formSmartId.countryCode;
            $scope.formSmartId.challengeID = null;

            userVote.$save()
                .then(function (voteInitResult) {
                    $log.debug('voteInitSmartIdResult', voteInitResult);
                    $scope.challengeID = voteInitResult.challengeID;
                    $scope.formSmartId.challengeID = voteInitResult.challengeID;
                    var token = voteInitResult.token;
                    return TopicVote
                        .status({topicId: topic.id, voteId: topic.vote.id, prefix: sAuth.getUrlPrefix(), userId: sAuth.getUrlUserId(), token: token}).$promise
                        .then(function (response) {
                            console.log(response);
                            var statusCode = response.status.code;
                            switch (statusCode) {
                                case 20001:
                                case 20002:
                                    // Done
                                    return response.data;
                                default:
                                    $log.error('Mobile signing failed', response);
                                    ngDialog.closeAll();
                                    return $q.defer().reject(response);
                            }
                        });
                })
                .then(function (voteStatusResult) {
                    console.log(voteStatusResult.bdocUri);
                    $log.debug('voteVoteSign succeeded', arguments);
                    ngDialog.closeAll({ // Pass Vote options, so we can show selected option for the unauthenticated User
                        options:  $scope.optionsSelected,
                        bdocUri: voteStatusResult.data.bdocUri
                    });
                }, function (err) {
                    $scope.formSmartId.isLoading = false;
                });
        };

        var pollVoteSmartIdSignStatus = function (topicId, voteId, token, milliseconds, retry) {
            if (!retry) retry = 80;
            if (!retry--) throw new Error('Too many retries');

            var voteStatusPromise = TopicVote.status({topicId: topic.id, voteId: topic.vote.id, prefix: sAuth.getUrlPrefix(), userId: sAuth.getUrlUserId(), token: token}).$promise

            return voteStatusPromise
                .then(function (response) {
                    var statusCode = response.status.code;
                    switch (statusCode) {
                        case 20001:
                            return $timeout(function () {
                                return pollVoteSmartIdSignStatus(topicId, voteId, token, milliseconds, retry);
                            }, milliseconds, false);
                        case 20002:
                            // Done
                            return response.data;
                        default:
                            $log.error('Mobile signing failed', response);
                            return $q.defer().reject(response);
                    }
                });
        };

        var hwCryptoErrorToTranslationKey = function (err) {
            var errorKeyPrefix = 'MSG_ERROR_HWCRYPTO_';

            switch (err.message) {
                case hwcrypto.NO_CERTIFICATES:
                case hwcrypto.USER_CANCEL:
                case hwcrypto.NO_IMPLEMENTATION:
                    return errorKeyPrefix + err.message.toUpperCase();
                    break;
                case hwcrypto.INVALID_ARGUMENT:
                case hwcrypto.NOT_ALLOWED:
                case hwcrypto.TECHNICAL_ERROR:
                    $log.error(err.message, 'Technical error from HWCrypto library', err);
                    return errorKeyPrefix + 'TECHNICAL_ERROR';
                    break;
                default:
                    $log.error(err.message, 'Unknown error from HWCrypto library', err);
                    return errorKeyPrefix + 'TECHNICAL_ERROR';
            }
        };

    }]);
