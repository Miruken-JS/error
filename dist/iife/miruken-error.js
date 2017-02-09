(function (exports,mirukenCore,mirukenCallback) {
'use strict';

var Errors = mirukenCore.DuckTyping.extend({
    handleError: function handleError(error, context) {},
    handleException: function handleException(exception, context) {},
    reportError: function reportError(error, context) {},
    reportException: function reportException(exception, context) {},
    clearErrors: function clearErrors(context) {}
});

var ErrorHandler = mirukenCallback.Handler.extend(Errors, {
    handleError: function handleError(error, context) {
        var result = Errors(mirukenCallback.$composer).reportError(error, context);
        return result === undefined ? Promise.reject(error) : Promise.resolve(result);
    },
    handleException: function handleException(exception, context) {
        var result = Errors(mirukenCallback.$composer).reportException(exception, context);
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

mirukenCallback.Handler.implement({
    $recover: function $recover(context) {
        return this.filter(function (callback, composer, proceed) {
            try {
                var handled = proceed();
                if (handled) {
                    var result = callback.callbackResult;
                    if (mirukenCore.$isPromise(result)) {
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

exports.Errors = Errors;
exports.ErrorHandler = ErrorHandler;

}((this.mirukenError = this.mirukenError || {}),mirukenCore,mirukenCallback));
