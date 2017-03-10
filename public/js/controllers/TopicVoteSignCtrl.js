'use strict';

app.controller('TopicVoteSignCtrl', ['$scope', '$state', '$log', '$q', '$timeout', 'hwcrypto', 'ngDialog', 'sTranslate', 'sTopic', 'sAuth', 'TopicVote', function ($scope, $state, $log, $q, $timeout, hwcrypto, ngDialog, sTranslate, sTopic, sAuth, TopicVote) {
    $log.debug('TopicVoteSignCtrl', $scope.ngDialogData);

    var topic = $scope.ngDialogData.topic;
    var option = $scope.ngDialogData.option;

    $scope.formMobile = {
        pid: null,
        phoneNumber: null,
        challengeID: null,
        isLoading: false
    };

    $scope.challengeID = null;

    // TODO: Multiple choice support some day... - https://trello.com/c/WzECsxck/280-bug-vote-sign-no-multiple-choice-support
    $scope.optionSelected = option;

    $scope.voteSignError = null;

    $scope.doCloseVoteSignError = function () {
        $scope.voteSignError = null;
    };

    $scope.doSignWithCard = function () {
        $log.debug('doSign()', hwcrypto);

        $scope.voteSignError = null;
        $scope.isLoadingIdCard = true;

        hwcrypto
            .getCertificate({})
            .then(function (certificate) {
                $log.debug('Certificate', certificate);
                $scope.voteSignError = null;

                var votePromise;

                var userVote = new TopicVote({id: topic.vote.id, topicId:topic.id});
                userVote.options = [{optionId: $scope.optionSelected.id}];
                userVote.certificate = certificate.hex;
                return $q.all([certificate, userVote.$save()]);
            })
            .then(function (results) {
                $log.debug('After Vote', arguments);
                var certificate = results[0];
                var voteResponse = results[1];

                var signedInfoDigest = voteResponse.data.data.signedInfoDigest;
                var signedInfoHashType = voteResponse.data.data.signedInfoHashType;
                var token = voteResponse.data.data.token;

                return $q.all([
                    hwcrypto.sign(certificate, {hex: signedInfoDigest, type: signedInfoHashType}, {}),
                    token
                ]);
            })
            .then(function (results) {
                var signature = results[0];
                var token = results[1];

                if (sAuth.user.loggedIn) {
                    return sTopic
                        .voteVoteSign(topicId, voteId, signature.hex, token);
                } else {
                    return sTopic
                        .voteVoteSignUnauth(topicId, voteId, signature.hex, token);
                }
            })
            .then(function (voteSignResult) {
                $log.debug('voteVoteSign succeeded', arguments);
                ngDialog.closeAll({ // Pass Vote options, so we can show selected option for the unauthenticated User
                    options: options,
                    bdocUri: voteSignResult.data.data.bdocUri
                });
            }, function (err) {
                $scope.isLoadingIdCard = false;

                var msg = null;
                if (err instanceof Error) { //hwcrypto and JS errors
                    msg = hwCryptoErrorToTranslationKey(err);
                } else { // API error response
                    sTranslate.errorsToKeys(err, 'VOTE');
                    msg = err.data.status.message;
                }

                $scope.$apply(function () {
                    $scope.voteSignError = msg;
                });
            });
    };

    $scope.doSignWithMobile = function () {
        $log.debug('doSignWithMobile()');

        $scope.formMobile.isLoading = true;
        $scope.voteSignError = null;

        var userVote = new TopicVote({id: topic.vote.id, topicId:topic.id});
        userVote.options = [{optionId: $scope.optionSelected.id}];
        userVote.pid = $scope.formMobile.pid;
        userVote.certificate = null;
        userVote.phoneNumber = $scope.formMobile.phoneNumber;

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
                    options: [{optionId: $scope.optionSelected.id}],
                    bdocUri: voteStatusResult.bdocUri
                });
            }, function (err) {
                $log.error('Something failed when trying to sign with mobile', err);

                var msg = null;
                if (!err) {
                    $log.error('Error when signing with mobile id', err);
                    msg = 'MSG_ERROR_50000';
                } else {
                    sTranslate.errorsToKeys(err, 'VOTE');
                    msg = err.status.message;
                }

                $scope.formMobile.isLoading = false;
                $scope.formMobile.challengeID = null;

                $scope.voteSignError = msg;
            });
    };

    var pollVoteMobileSignStatus = function (topicId, voteId, token, milliseconds, retry) {
        if (!retry) retry = 80;
        if (!retry--) throw new Error('Too many retries');

        var voteStatusPromise = TopicVote.status({topicId:topic.id, voteId: topic.vote.id, prefix:sAuth.getUrlPrefix(), userId: sAuth.getUrlUserId(), token:token}).$promise

        return voteStatusPromise
            .then(function (response) {
                console.log(response);
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
