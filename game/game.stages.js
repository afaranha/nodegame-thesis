/**
 * # Game stages definition file
 * Copyright(c) 2022 a <b>
 * MIT Licensed
 *
 * Stages are defined using the stager API
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

     stager
        .next('instructions')

        .next('quiz')

        .repeatStage('game', settings.ROUNDS)

        .next('end')

        .gameover();

    stager.extendStage('game', {
        steps: [
            'bidder',
            'responder'
        ]
    });


    // Notice: here all stages have one step named after the stage.

    // Skip one stage.
    // stager.skip('instructions');

    // Skip multiple stages:
    stager.skip([ 'instructions', 'quiz' ])

    // Skip a step within a stage:
    // stager.skip('stageName', 'stepName');

};
