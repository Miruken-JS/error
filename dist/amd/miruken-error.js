define(['exports', 'miruken-core', 'miruken-callback'], function (exports, _mirukenCore, _mirukenCallback) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.ErrorCallbackHandler = exports.Errors = undefined;
    var Errors = exports.Errors = _mirukenCore.Protocol.extend({
        handleError: function handleError(error, context) {},
        handleException: function handleException(exception, context) {},
        reportError: function reportError(error, context) {},
        reportException: function reportException(exception, context) {},
        clearErrors: function clearErrors(context) {}
    });

    var ErrorCallbackHandler = exports.ErrorCallbackHandler = _mirukenCallback.CallbackHandler.extend(Errors, {
        handleError: function handleError(error, context) {
            var result = Errors(_mirukenCallback.$composer).reportError(error, context);
            return result === undefined ? Promise.reject(error) : Promise.resolve(result);
        },
        handleException: function handleException(exception, context) {
            var result = Errors(_mirukenCallback.$composer).reportException(exception, context);
            return result === undefined ? Promise.reject(exception) : Promise.resolve(result);
        },
        reportError: function reportError(error, context) {
            console.error(error);
            return Promise.resolve();
        },
        reportException: function reportException(exception, context) {
            console.error(exception);
            return Promise.resolve();
        },
        clearErrors: function clearErrors(context) {}
    });

    _mirukenCallback.CallbackHandler.implement({
        $recover: function $recover(context) {
            return this.filter(function (callback, composer, proceed) {
                try {
                    var handled = proceed();
                    if (handled) {
                        var result = callback.callbackResult;
                        if ((0, _mirukenCore.$isPromise)(result)) {
                            callback.callbackResult = result.catch(function (err) {
                                return Errors(composer).handleError(err, context);
                            });
                        }
                    }
                    return handled;
                } catch (ex) {
                    Errors(composer).handleException(ex, context);
                    return true;
                }
            });
        },
        $recoverError: function $recoverError(context) {
            var _this = this;

            return function (error) {
                return Errors(_this).handleError(error, context);
            };
        }
    });
});