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
        cb: function() {
            node.once.done(function(msg) {
                console.log('============ DONE.');
                console.log(msg);
                // console.log(msg.data);
                console.log(msg.data.offer);
                let data = msg.data;
                let offer = data.offer;
                let response = { offer: offer, player: data.player }

                // Send the decision to the other player.
                // node.say('offer', data.partner, "========== PFFFFFFFFFFFFFF");
                // node.say('decision', data.partner, offer);
                node.say('decision', data.partner, response);

                // Update earnings counts, so that it can be saved
                // with GameRoom.computeBonus.
                // gameRoom.updateWin(msg.from, settings.COINS - offer);
                // gameRoom.updateWin(data.partner, offer);

            });
        }
    });

    stager.extendStep('responder', {
        matcher: true,
        cb: function() {
            node.once.done(function(msg) {
                console.log('============ DONE.');
                // console.log(msg);
                // console.log(msg.data);
                // console.log(msg.data.offer);
                let data = msg.data;
                let offer = data.offer;

                // Send the decision to the other player.
                // node.say('offer', data.partner, "========== PFFFFFFFFFFFFFF");
                node.say('decision', data.partner, offer);

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
