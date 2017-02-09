import { Base, Protocol } from "miruken-core";
import { Context } from "miruken-context";
import { Errors, ErrorHandler } from "../src/error";
import chai from "chai";

const expect = chai.expect;

describe("ErrorHandler", () => {
    describe("#handleError", () => {
        it("should handle errors", done => {
            var context      = new Context(),
                errorHandler = new ErrorHandler(),
                error        = new Error("passwords do not match");
            context.addHandlers(errorHandler);
            Promise.resolve(Errors(context).handleError(error)).then(() => {
                done();
            });
        });

        it("should be able to customize error handling", done => {
            var context      = new Context(),
                errorHandler = new ErrorHandler(),
                error        = new Error("Something bad happended");
            context.addHandlers(errorHandler);
            var customize    = context.newChild().extend({
                reportError(error, context) {
                    return Promise.resolve("custom");
                }
            });
            Promise.resolve(Errors(customize).handleError(error)).then(result => {
                expect(result).to.equal("custom");
                done();
            });
        });
    });

    describe("#handleException", () => {
        it("should handle exceptions", done => {
            var context      = new Context(),
                errorHandler = new ErrorHandler(),
                exception    = new TypeError("Expected a string argument");
            context.addHandlers(errorHandler);
            Promise.resolve(Errors(context).handleException(exception)).then(() => {
                done();
            });
        });
    })
});

describe("Handler", () => {
    var Payments = Protocol.extend({
        validateCard(card) {},
        processPayment(payment) {}
    });

    var Paymentech = Base.extend(Payments, {
        validateCard(card) {
            if (card.number.length < 10)
                throw new Error("Card number must have at least 10 digits");
        },
        processPayment(payment) {
            if (payment.amount > 500)
                return Promise.reject(new Error("Amount exceeded limit"));
        }
    });

    describe("#recoverable", () => {
        it("should implicitly recover from errors synchronously", () => {
            var context      = new Context(),
                errorHandler = new ErrorHandler();
            context.addHandlers(new Paymentech(), errorHandler);
            Payments(context.$recover()).validateCard({number:"1234"});
        });

        it("should implicitly recover from errors asynchronously", done => {
            var context      = new Context(),
                errorHandler = new ErrorHandler();
            context.addHandlers(new Paymentech(), errorHandler); 
            var pay = Payments(context.$recover()).processPayment({amount:1000});
            Promise.resolve(pay).then(result => {
                expect(result).to.be.undefined;
                done();
            });
        });

        it("should be able to customize recovery from errors asynchronously", done => {
            var context      = new Context(),
                errorHandler = new ErrorHandler();
            context.addHandlers(new Paymentech(), errorHandler);
            var customize    = context.newChild().extend({
                reportError(error, context) {
                    return Promise.resolve("custom");
                }
            });
            var pay = Payments(customize.$recover()).processPayment({amount:1000});
            Promise.resolve(pay).then(result => {
                expect(result).to.equal("custom");
                done();
            });
        });

        it("should recover explicitly", done => {
            var context      = new Context(),
                errorHandler = new ErrorHandler();
            context.addHandlers(new Paymentech(), errorHandler);
            var pay = Payments(context).processPayment({amount:1000})
                .catch(context.$recoverError());
            Promise.resolve(pay).then(result => {
                expect(result).to.be.undefined;
                done();
            });
        });

        it("should be able to customize recovery explicitly", done => {
            var context      = new Context(),
                errorHandler = new ErrorHandler();
            context.addHandlers(new Paymentech(), errorHandler);
            var customize    = context.newChild().extend({
                reportError(error, context) {
                    return Promise.resolve("custom");
                }
            });
            var pay = Payments(context).processPayment({amount:1000})
                .catch(customize.$recoverError());
            Promise.resolve(pay).then(result => {
                expect(result).to.equal("custom");
                done();
            });
        });
    });
});
