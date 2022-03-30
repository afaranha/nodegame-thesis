/**
 * # Logic type implementation of the game stages
 * Copyright(c) 2022 a <b>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

const ngc = require('nodegame-client');
const J = ngc.JSUS;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    let node = gameRoom.node;
    let channel = gameRoom.channel;
    let memory = node.game.memory;

    // Must implement the stages here.

    stager.setOnInit(function() {
        // Initialize the client.
        // Will automatically save every entry in the database
        // to file memory.json (format ndjson).
        memory.stream();

        this.offers_table = {};
    });

    stager.extendStage('game', {
        init: function() {}
    });

    stager.extendStep('bidder', {
        matcher: {
            roles: [ 'DICTATOR', 'OBSERVER' ],
            match: 'round_robin',
            cycle: 'mirror_invert',
            // sayPartner: false
            // skipBye: false,

        },
        init: function() {
            console.log('============ INIT.');
            // console.log(Object.keys(node));
            // console.log(Object.keys(node.game));
            // console.log(node.game.playerList);
            // console.log(node.game.playerList.db);
            // // console.log(node.game.matcher);
            console.log(node.game.matcher.lastMatchesById);
            // console.log(node.game.matcher.matcher);
            // console.log(node.game.);
            console.log(this.offers_table);

            // this.offers_table = {};

            let entries = Object.entries(node.game.matcher.lastMatchesById);
            for (const [player_id, value] of entries) {
                if (value.role === "OBSERVER") {
                    if (!(player_id in this.offers_table)) {
                        this.offers_table[player_id] = {};
                    }
                }
            }

            this.last_offer = {};
        },
        cb: function() {
            node.on.done(function(msg) {
                console.log('============ DONE.');
                // console.log(msg);
                // console.log(this.offers_table);
                // console.log(node.game.offers_table);
                // console.log(msg.data);
                // console.log(msg.data.offer);
                let data = msg.data;

                if (data.role === 'DICTATOR') {
                    let offer = data.offer;
                    let response = {
                        offer: offer,
                        player: data.player,
                        offers_table: this.offers_table[data.partner]
                    };
                    console.log('========= DICTATOR MADE AN OFFER: ' + offer + " to " + data.partner);
                    console.log('========= PARTNER HISTORY: ' + this.offers_table[data.partner]);
                    console.log('========= PARTNER HISTORY: ' + (data.partner in this.offers_table));
                    node.say('decision', data.partner, response);
                } else if (data.role === 'OBSERVER') {
                    // console.log('========= OBSERVER');
                    // console.log(msg);
                    let status = data.response;
                    let offer = data.offer;
                    let final_offer = data.final_offer;
                    console.log('========= OBSERVER REPLIED THE OFFER: ' + status);
                    this.last_offer["status"] = status;
                    this.last_offer["offer"] = offer;
                    this.last_offer["final_offer"] = final_offer;

                    if (status === "accepted") {
                        let dictator = data.partner;
                        let player = data.player;
                        let final_offer = data.final_offer;
                        console.log('====== ACCEPTED OFFER: ' + final_offer.toString());

                        // if (!(player in this.offers_table[dictator])) {
                        //     this.offers_table[dictator][player] = []
                        // }
                        //
                        // this.offers_table[dictator][player].push(final_offer);
                        if (!(dictator in this.offers_table[player])) {
                            this.offers_table[player][dictator] = []
                        }

                        this.offers_table[player][dictator].push(final_offer);
                    } else {
                        console.log('====== REJECTED OFFER: ' + offer.toString() + ' AND GOT OFFER: ' + final_offer.toString());
                    }
                }

                console.log('====== UPDATED OFFER TABLE.');
                console.log(this.offers_table);

                // let offer = data.offer;
                // let response = {
                //     offer: offer,
                //     player: data.player,
                //     round: data.stage.round
                // };
                //
                // // Send the decision to the other player.
                // // node.say('offer', data.partner, "========== PFFFFFFFFFFFFFF");
                // // node.say('decision', data.partner, offer);
                // node.say('decision', data.partner, response);

                // Update earnings counts, so that it can be saved
                // with GameRoom.computeBonus.
                // gameRoom.updateWin(msg.from, settings.COINS - offer);
                // gameRoom.updateWin(data.partner, offer);

            });
        }
    });

    stager.extendStep('responder', {
        matcher: true,
        init: function() {
            console.log('============ INIT RESPONDER.');
            console.log(node.game.playerList.db);

            for (const player of node.game.playerList.db) {
                console.log(player.id);
                node.say('offer', player.id, this.last_offer);
            }

            // this.last_offer
        },
        cb: function() {
            node.once.done(function(msg) {
                console.log('============ DONE RESPONDER.');
                // console.log(msg);
                // // console.log(msg);
                // // console.log(msg.data);
                // // console.log(msg.data.offer);
                // let data = msg.data;
                // let offer = data.offer;
                //
                // // Send the decision to the other player.
                // // node.say('offer', data.partner, "========== PFFFFFFFFFFFFFF");
                // node.say('decision', data.partner, offer);

                // Update earnings counts, so that it can be saved
                // with GameRoom.computeBonus.
                // gameRoom.updateWin(msg.from, settings.COINS - offer);
                // gameRoom.updateWin(data.partner, offer);

            });
        }
    });

    // stager.extendStep('game', {
    //     matcher: {
    //         roles: [ 'DICTATOR', 'OBSERVER' ],
    //         match: 'round_robin',
    //         cycle: 'mirror_invert',
    //         // sayPartner: false
    //         // skipBye: false,
    //
    //     },
    //     cb: function() {
    //         node.once.done(function(msg) {
    //             console.log('============ DONE.');
    //             // console.log(msg);
    //             // console.log(msg.data);
    //             // console.log(msg.data.offer);
    //             let data = msg.data;
    //             let offer = data.offer;
    //
    //             // Send the decision to the other player.
    //             node.say('offer', data.partner, "========== PFFFFFFFFFFFFFF");
    //             node.say('decision', data.partner, offer);
    //
    //             // Update earnings counts, so that it can be saved
    //             // with GameRoom.computeBonus.
    //             gameRoom.updateWin(msg.from, settings.COINS - offer);
    //             gameRoom.updateWin(data.partner, offer);
    //
    //         });
    //     }
    // });

    stager.extendStep('end', {
        init: function() {

            // Feedback.
            memory.view('feedback').stream({
                header: [ 'time', 'timestamp', 'player', 'feedback' ],
                format: 'csv'
            });

            // Email.
            memory.view('email').stream({
                header: [ 'timestamp', 'player', 'email' ],
                format: 'csv'
            });

        },
        cb: function() {

            // Saves bonus file, and notifies players.
            gameRoom.computeBonus();

            // Dump all memory.
            // memory.save('memory_all.json');

            // Save times of all stages.
            memory.done.save('times.csv', {
                header: [
                    'session', 'player', 'stage', 'step', 'round',
                    'time', 'timeup'
                ]
            });
        }
    });

    stager.setOnGameOver(function() {
        // Something to do.
    });
};
