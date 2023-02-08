import * as angular from 'angular';

export class TopicVoteService {
    public countTotal = 0;
    public isLoading = false;
    private isSaving = false;
    private topicId = null;
    private voteId = null;
    private options = [];
    public isLoadingIdCard = false;
    public challengeID = null;
    private pid;
    private phoneNumber;
    private countryCode;
    private voteSignResult;

    constructor(private $window, private $state, private TopicVote, private hwcrypto, private $q, private $log, private $timeout, private sAuth, private sNotification) {}

    doSignWithCard () {
        this.isLoadingIdCard = true;
        this.hwcrypto
            .getCertificate({})
            .then((certificate) => {
                const userVote = {
                    voteId: this.voteId,
                    topicId: this.topicId,
                    options: this.options,
                    certificate: certificate.hex
                };

                return this.$q.all([certificate, this.TopicVote.cast(userVote)]);
            })
            .then((results) => {
                const certificate = results[0];
                const voteResponse = results[1];

                const signedInfoDigest = voteResponse.signedInfoDigest;
                const signedInfoHashType = voteResponse.signedInfoHashType;
                const token = voteResponse.token;

                return this.$q.all([
                    this.hwcrypto.sign(certificate, {hex: signedInfoDigest, type: signedInfoHashType}, {}),
                    token
                ]);
            })
            .then((results) => {
                const signature = results[0];
                const token = results[1];
                const signTopicVote = {
                    id: this.voteId,
                    topicId: this.topicId,
                    signatureValue: signature.hex,
                    token:token
                };

                return this.TopicVote.sign(signTopicVote);
            })
            .then((voteSignResult) => {
                this.voteSignResult = voteSignResult;
                this.$state.reload();
            }, (err) => {
                this.isLoading = false;
                this.isLoadingIdCard = false;
                this.challengeID = null;

                let msg = null;
                if (err instanceof Error) { //hwcrypto and JS errors
                    msg = this.hwCryptoErrorToTranslationKey(err);
                } else { // API error response
                    msg = err.status.message;
                }

                this.sNotification.addError(msg);
            });
    };

    doSignWithMobile () {
        this.$log.debug('doSignWithMobile()');

        this.isLoading = true;

        const userVote = {
            voteId: this.voteId,
            topicId: this.topicId,
            options: this.options,
            pid: this.pid,
            certificate: null,
            phoneNumber: this.phoneNumber
        };

        this.TopicVote.cast(userVote)
            .then((voteInitResult) => {
                this.$log.debug('voteInitResult', voteInitResult);
                this.challengeID = voteInitResult.challengeID;
                const token = voteInitResult.token;
                return this.pollVoteMobileSignStatus(token, 3000, 80);
            })
            .then((voteStatusResult) => {
                this.voteSignResult = voteStatusResult;
                this.isLoading = false;
                this.isLoadingIdCard = false;
                this.challengeID = null;
                location.reload();
                this.$log.debug('voteVoteSign succeeded');
            }, (err) => {
                this.isLoading = false;
            });
    };

    pollVoteMobileSignStatus (token, milliseconds, retry) {
        if (!retry) retry = 80;
        if (!retry--) throw new Error('Too many retries');


        return this.TopicVote.status({topicId: this.topicId, voteId: this.voteId, token: token})
            .then((response) => {
                var statusCode = response.status.code;
                if (!statusCode) return response;
                switch (statusCode) {
                    case 20001:
                        return this.$timeout(() => {
                            return this.pollVoteMobileSignStatus(token, milliseconds, retry);
                        }, milliseconds, false);
                    case 20002:
                        // Done
                        return response.data;
                    default:
                        this.$log.error('Mobile signing failed', response);
                        return this.$q.defer().reject(response);
                }
            });
    };

    doSignWithSmartId () {
        this.$log.debug('doSignWithSmartId()');
        this.isLoading = true;

        const userVote = {
            voteId: this.voteId,
            topicId: this.topicId,
            options: this.options,
            pid: this.pid,
            certificate: null,
            phoneNumber: null,
            countryCode: this.countryCode
        };
        this.challengeID = null;

        this.TopicVote.cast(userVote)
            .then((voteInitResult) => {
                this.$log.debug('voteInitSmartIdResult', voteInitResult);
                this.challengeID = voteInitResult.challengeID;
                this.challengeID = voteInitResult.challengeID;
                const token = voteInitResult.token;

                return this.pollVoteSmartIdSignStatus(token, 3000, 80);
            })
            .then((voteStatusResult) => {
                this.voteSignResult = voteStatusResult;
                this.$log.debug('voteVoteSign succeeded');
                this.isLoading = false;
                this.isLoadingIdCard = false;
                this.challengeID = null;
                location.reload();
            }, (err) => {
                console.error(err);
                this.isLoading = false;
            });
    };

    pollVoteSmartIdSignStatus (token, milliseconds, retry) {
        if (!retry) retry = 80;
        if (!retry--) throw new Error('Too many retries');

        return this.TopicVote.status({topicId: this.topicId, voteId: this.voteId, token: token})
            .then((response) => {
                const statusCode = response.status?.code;
                if (!statusCode) return response;
                switch (statusCode) {
                    case 20001:
                        return this.$timeout(() => {
                            return this.pollVoteSmartIdSignStatus(token, milliseconds, retry);
                        }, milliseconds, false);
                    case 20002:
                        // Done
                        return response.data;
                    default:
                        this.$log.error('Smart-ID signing failed', response);
                        return this.$q.defer().reject(response);
                }

            });
    };

    hwCryptoErrorToTranslationKey (err) {
        const errorKeyPrefix = 'MSG_ERROR_HWCRYPTO_';

        switch (err.message) {
            case this.hwcrypto.NO_CERTIFICATES:
            case this.hwcrypto.USER_CANCEL:
            case this.hwcrypto.NO_IMPLEMENTATION:
                return errorKeyPrefix + err.message.toUpperCase();
                break;
            case this.hwcrypto.INVALID_ARGUMENT:
            case this.hwcrypto.NOT_ALLOWED:
            case this.hwcrypto.TECHNICAL_ERROR:
                this.$log.error(err.message, 'Technical error from HWCrypto library', err);
                return errorKeyPrefix + 'TECHNICAL_ERROR';
                break;
            default:
                this.$log.error(err.message, 'Unknown error from HWCrypto library', err);
                return errorKeyPrefix + 'TECHNICAL_ERROR';
        }
    };
};

angular
  .module("citizenos")
  .service("TopicVoteService", ['$window', '$state', 'TopicVote', 'hwcrypto', '$q', '$log', '$timeout', 'sAuth', 'sNotification', TopicVoteService]);
