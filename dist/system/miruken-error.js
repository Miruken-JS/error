'use strict';

System.register(['miruken-core', 'miruken-callback'], function (_export, _context) {
    "use strict";

    var Protocol, $isPromise, CallbackHandler, $composer, Errors, ErrorCallbackHandler;
    return {
        setters: [function (_mirukenCore) {
            Protocol = _mirukenCore.Protocol;
            $isPromise = _mirukenCore.$isPromise;
        }, function (_mirukenCallback) {
            CallbackHandler = _mirukenCallback.CallbackHandler;
            $composer = _mirukenCallback.$composer;
        }],
        execute: function () {
            _export('Errors', Errors = Protocol.extend({
                handleError: function handleError(error, context) {},
                handleException: function handleException(exception, context) {},
                reportError: function reportError(error, context) {},
                reportException: function reportException(exception, context) {},
                clearErrors: function clearErrors(context) {}
            }));

            _export('Errors', Errors);

            _export('ErrorCallbackHandler', ErrorCallbackHandler = CallbackHandler.extend(Errors, {
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
            }));

            _export('ErrorCallbackHandler', ErrorCallbackHandler);

            CallbackHandler.implement({
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
        }
    };
});