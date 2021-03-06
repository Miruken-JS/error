import { $isPromise, DuckTyping } from 'miruken-core';
import { $composer, Handler } from 'miruken-callback';

var Errors = DuckTyping.extend({
    handleError: function handleError(error, context) {},
    handleException: function handleException(exception, context) {},
    reportError: function reportError(error, context) {},
    reportException: function reportException(exception, context) {},
    clearErrors: function clearErrors(context) {}
});

var ErrorHandler = Handler.extend(Errors, {
    handleError: function handleError(error, context) {
        var result = Errors($composer).reportError(error, context);
        return result === undefined ? Promise.reject(error) : Promise.resolve(result);
    },
    handleException: function handleException(exception, context) {
        var result = Errors($composer).reportException(exception, context);
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

Handler.implement({
    $recover: function $recover(context) {
        return this.filter(function (callback, composer, proceed) {
            try {
                var handled = proceed();
                if (handled) {
                    var result = callback.callbackResult;
                    if ($isPromise(result)) {
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

export { Errors, ErrorHandler };
