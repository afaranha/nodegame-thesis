/**
 * # Player type implementation of the game stages
 * Copyright(c) 2022 a <b>
 * MIT Licensed
 *
 * Each client type must extend / implement the stages defined in `game.stages`.
 * Upon connection each client is assigned a client type and it is automatically
 * setup with it.
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    stager.setOnInit(function() {
        var header;
        header = W.generateHeader();
        W.generateFrame();

        // Add widgets.
        this.visuaStage = node.widgets.append('VisualStage', header);
        this.visualRound = node.widgets.append('VisualRound', header);
        this.visualTimer = node.widgets.append('VisualTimer', header);
        this.doneButton = node.widgets.append('DoneButton', header);

        this.decision_table = {};
    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm',
        cb: function() {
            // Note: we need to specify node.game.settings,
            // and not simply settings, because this code is
            // executed on the client.
            var s = node.game.settings;
            // Replace variables in the instructions.
            W.setInnerHTML('coins', s.COINS);
            W.setInnerHTML('rounds', s.ROUNDS);
            W.setInnerHTML('exchange-rate', (s.COINS * s.EXCHANGE_RATE));
        }
    });

    stager.extendStep('quiz', {
        init: function() {
            node.game.visualTimer.hide();
        },
        cb: function() {
            // Modify CSS rules on the fly.
            W.cssRule('.choicetable-left, .choicetable-right ' +
                      '{ width: 200px !important; }');

            W.cssRule('table.choicetable td { text-align: left !important; ' +
                      'font-weight: normal; padding-left: 10px; }');
        },

        // Make a widget step.
        widget: {
            name: 'ChoiceManager',
            id: 'quiz',
            options: {
                mainText: 'Answer the following questions to check ' +
                          'your understanding of the game.',
                forms: [
                    {
                        name: 'ChoiceTable',
                        id: 'howmany',
                        mainText: 'How many players are there in this game? ',
                        choices: [ 1, 2, 3 ],
                        correctChoice: 1
                    },
                    {
                        name: 'ChoiceTable',
                        id: 'coins',
                        mainText: 'How many coins do you divide each round?',
                        choices: [
                            settings.COINS,
                            settings.COINS + 100,
                            settings.COINS + 25,
                            'Not known'
                        ],
                        correctChoice: 0
                    }
                ],
                formsOptions: {
                    shuffleChoices: true
                }
            }
        },
        exit: function() {
            node.game.visualTimer.show();
        },
    });

    stager.extendStep('bidder', {
        roles: {
            DICTATOR: {
                frame: 'game.htm',
                timer: settings.bidTime,
                cb: function() {
                    var div;

                    // Make the dictator display visible and returns it.
                    div = W.show('dictator');
                    node.game.bid = node.widgets.append('ChoiceTable', div, {
                        id: 'offer_type',
                        title: false,
                        requiredChoice: true,
                        mainText: 'Select an offer to the client',
                        choices: [
                            "Bad", "Medium", "Good"
                        ]
                    });
                },
                done: function() {
                    return { offer: node.game.bid.getValues().value };
                },
                timeup: function() {
                    node.game.bid.setValues();
                    node.done();
                }
            },
            OBSERVER: {
                frame: 'game.htm',
                timer: settings.bidTime,
                donebutton: false,
                cb: function() {
                    var div;

                    // Make the dictator display visible and returns it.
                    div = W.show('observer');
                    W.hide('make_decision');


                    node.on.data('decision', function(msg) {
                        // this.offer = msg.data
                        console.log("============== RECEIVED");
                        console.log(msg);
                        let offer = msg.data.offer

                        node.game.doneButton.enable();
                        W.show('make_decision');
                        if (node.game.decision_table[msg.data.player]) {
                            let text = "The quality of offers this banker sent you was: "
                            W.setInnerHTML('history', text + node.game.decision_table[msg.data.player].toString());
                        }

                        W.gid('accept').onclick = function() {
                            if (!(msg.data.player in node.game.decision_table)) {
                                node.game.decision_table[msg.data.player] = []
                            }

                            node.game.decision_table[msg.data.player].push(offer);
                            node.done({ response: 'accepted', offer: offer, final_offer: offer });
                        };

                        W.gid('reject').onclick = function() {
                            console.log("REJECTED!!!");
                            console.log(msg.data);

                            const offers = ["Bad", "Medium", "Good"];
                            var new_offers = [];
                            for (const o of offers) {
                                if (o !== offer) {
                                    new_offers.push(o);
                                }
                            }
                            console.log("====================== OFFERS");
                            console.log(msg.data);
                            console.log(new_offers);
                            var new_offer = new_offers[Math.floor(Math.random()*new_offers.length)];


                            // new_offers.random();
                            // console.log(new_offers);
                            // offer = new_offers[0];
                            console.log(new_offer);
                            // node.done({ response: 'rejected', final_offer: offer })
                            node.done({ response: 'rejected', offer: offer, final_offer: new_offer });
                        };
                    });
                }
            }
        }
    });

    stager.extendStep('responder', {
        roles: {
            DICTATOR: {
                frame: 'result.htm',
                timer: settings.bidTime,
                cb: function() {
                    W.write(' Your ' + '' + ' offer was accepted.', W.gid('container'));
                }
            },
            OBSERVER: {
                frame: 'result.htm',
                timer: settings.bidTime,
                cb: function() {
                    W.write(' You accepted a ' + '' + ' offer.', W.gid('container'));
                }
            }
        }
    });

    // stager.extendStep('game', {
    //     frame: 'game.htm',
    //     roles: {
    //         DICTATOR: {
    //             timer: settings.bidTime,
    //             cb: function() {
    //                 var div;
    //
    //                 // Make the dictator display visible and returns it.
    //                 div = W.show('dictator');
    //
    //                 // Add widget to validate numeric input.
    //                 // node.game.bid = node.widgets.append('CustomInput', div, {
    //                 //     type: 'int',
    //                 //     min: 0,
    //                 //     max: node.game.settings.COINS,
    //                 //     requiredChoice: true,
    //                 //     mainText: 'Make an offer between 0 and ' +
    //                 //         node.game.settings.COINS + ' to another player'
    //                 // });
    //                 node.game.bid = node.widgets.append('ChoiceTable', div, {
    //                     id: 'offer_type',
    //                     title: false,
    //                     // requiredChoice: true,
    //                     mainText: 'Select an offer to the client',
    //                     choices: [
    //                         "Bad", "Medium", "Good"
    //                     ]
    //                 });
    //
    //                 console.log("================ SETTINGS");
    //                 // console.log(settings);
    //
    //
    //                 // node.say("offer", "partner_id", node.game.bid.getValues().value);
    //                 node.say("offer", node.game.bid.getValues().value);
    //                 node.on.data("reply", function(msg) {
    //                     W.writeln("Your partner thinks: " + msg.data || "nothing");
    //                     node.timer.randomDone({ offer: node.game.bid.getValues().value });
    //                 });
    //             },
    //             done: function() {
    //                 return { offer: node.game.bid.getValues().value };
    //             },
    //             timeup: function() {
    //                 node.game.bid.setValues();
    //                 node.done();
    //             }
    //         },
    //         OBSERVER: {
    //             donebutton: false,
    //             cb: function() {
    //                 var dotsObj;
    //
    //                 // Make the observer display visible.
    //                 W.show('observer');
    //
    //                 dotsObj = W.addLoadingDots(W.gid('dots'));
    //
    //                 node.on.data('offer', function(msg) {
    //                     node.log('============ RECEIVED.');
    //                     node.log(msg.data);
    //                 });
    //
    //                 node.on.data('decision', function(msg) {
    //                     node.log('============ DECISION.');
    //                     node.game.doneButton.enable();
    //                     dotsObj.stop();
    //                     W.setInnerHTML('waitingFor', 'Decision arrived: ');
    //                     W.setInnerHTML('decision',
    //                                    'The dictator offered: ' +
    //                                    msg.data + ' ECU.');
    //
    //                     W.show("reply_p");
    //                     W.gid("submit_reply").onclick = function() {
    //                         node.say("reply", "dictator_id", W.gid("observer_reply"));
    //                         node.done();
    //                     };
    //
    //                     // Leave the decision visible for up 5 seconds.
    //                     // If user clicks Done, it can advance faster.
    //                     // node.timer.wait(5000).done();
    //                 });
    //             }
    //         }
    //     }
    // });

    stager.extendStep('end', {
        widget: 'EndScreen',
        init: function() {
            node.game.doneButton.destroy();
            node.game.visualTimer.destroy();
        }
    });
};
