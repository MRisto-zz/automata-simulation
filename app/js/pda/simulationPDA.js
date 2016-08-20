//Simulator for the simulation of the PDA
function SimulationPDA($scope) {
    "use strict";

    var self = this;
    SimulationDFA.apply(self, arguments);

    self.stack = new PDAStack();

    var parentReset = this.reset;

    /**
     * Should reset the simulation
     */
    self.reset = function () {
        self.stack = new PDAStack();
        self.stack.listener.push($scope.statediagram);
        parentReset.apply(this);
        _.forEach($scope.statediagram.drawnStack, function () {
            $scope.statediagram.removeFromStack();
        });
        $scope.statediagram.addToStack(self.stack.stackContainer);
    };

    /**
     * calcs the next step
     */
    self.calcNextStep = function () {
        self.isNextStepCalculated = true;
        self.status = 'step';
        self.nextChar = self.inputWord[self.madeSteps];
        //get the next transition
        self.transition = _.filter($scope.config.transitions, function (transition) {
            //if there is no next char then the word is not accepted
            if (self.nextChar === undefined) {
                self.status = 'not accepted';
                return;
            }
            //get the nextState
            return transition.fromState == _.last(self.statusSequence) && transition.name == self.nextChar && transition.readFromStack === self.stack.stackContainer[self.stack.stackContainer.length - 1];
        });
        //if there is no next transition, then the word is not accepted
        if (_.isEmpty(self.transition)) {
            self.transition = null;
            self.status = 'not accepted';
            return;
        }
        //save transition and nextState for the animation
        self.transition = self.transition[0];
        self.nextState = self.transition.toState;
    };

    /**
     * animate the next Move (a step has more than three moves)
     */
    self.animateNextMove = function () {
        if (!self.isNextStepCalculated) {
            self.calcNextStep();
        }

        //First: Paint the transition & wait
        if (!self.animatedTransition) {
            self.stack.pop();
            self.animatedTransition = true;
            self.animated.transition = self.transition;
            self.goneTransitions.push(self.transition);

            //Second: Paint the nextstate & wait
        } else if (!self.animatedNextState && self.animatedTransition) {
            self.animatedNextState = true;
            self.animated.nextState = self.nextState;

            //Third: clear transition & currentStateColor and set currentState = nextState and wait
        } else if (self.animatedTransition && self.animatedNextState) {
            self.stack.push(self.animated.transition.writeToStack);

            self.animated.transition = null;
            self.animated.nextState = null;
            self.animated.currentState = self.nextState;

            self.currentState = self.nextState;
            //after the step was animated it adds a step to the madeSteps
            self.madeSteps++;
            //if the nextState is the finalState
            if (self.inputWord.length == self.madeSteps) {
                if (self.stack.stackContainer.length === 0) {
                    self.status = 'accepted';
                } else {
                    self.status = 'not accepted';
                }
            }

            //Reset the step & start the next step
            self.isNextStepCalculated = false;
            self.animatedNextState = false;
            self.animatedTransition = false;
            self.processedWord += self.nextChar;

            //push the currentState to the statusSequence
            self.statusSequence.push(self.currentState);

            //check if there is a next transition
            if (self.status !== "accepted" && self.status !== "not accepted")
                self.calcNextStep();
        }

    };

    /**
     * animates the last move if there is no lastmove, then calcLastStep
     * @return {[type]} [description]
     */
    self.animateLastMove = function () {
        if (self.animatedTransition && self.animatedNextState) {
            self.stack.tryToPop(self.animated.transition.writeToStack);
            self.animated.nextState = null;
            self.animatedNextState = false;
        }
        else if (self.animatedTransition) {
            self.stack.push(self.animated.transition.readFromStack);
            self.animated.transition = null;
            self.animatedTransition = false;
            self.goneTransitions.pop();
        } else {
            self.calcLastStep();
        }

    };

    /**
     * checks if a word is accepted from the automata
     * @return {Boolean}
     */
    self.isInputWordAccepted = function (inputWord) {
        return self.getAllPossibleSequences(inputWord).length !== 0;
    };


    /**
     * Returns all possible sequences, if an empty array is returned, there is no possibleSequence
     * @param inputWord
     * @returns {Array}
     */
    self.getAllPossibleSequences = function (inputWord) {
        //init needed variables
        var possibleSequences = [];
        var stackSequences = [];
        var tmpSequences = {};


        if (inputWord.length !== 0) {
            tmpSequences = self.getNextTransitions($scope.config.startState, inputWord[0], new PDAStack().stackFirstSymbol);
            for (var i = 0; i < tmpSequences.length; i++) {
                var tmpSequence = {};
                tmpSequence.stack = new PDAStack();
                tmpSequence.stack.push(tmpSequences[i].writeToStack);
                tmpSequence.value = [tmpSequences[i]];

                stackSequences.push(tmpSequence);
            }

        }

        while (stackSequences.length !== 0) {
            tmpSequence = stackSequences.pop();
            if (tmpSequence.value.length === inputWord.length && tmpSequence.stack.stackContainer.length === 0) {
                possibleSequences.push(tmpSequence.value);
            } else if (inputWord.length > tmpSequence.value.length && tmpSequence.stack.stackContainer.length !== 0) {
                var tmpSequences = [];
                _.forEach(self.getNextTransitions(_.last(tmpSequence.value).toState, inputWord[tmpSequence.value.length], tmpSequence.stack.pop()), function (sequence) {
                    var newTmpSequence = {};
                    newTmpSequence.stack = new PDAStack(tmpSequence.stack.stackContainer);
                    newTmpSequence.stack.push(sequence.writeToStack);
                    newTmpSequence.value = _.concat(tmpSequence.value, sequence);
                    tmpSequences.push(newTmpSequence);
                });
                stackSequences = _.concat(stackSequences, tmpSequences);

            }
        }
        return possibleSequences;

    };


    /**
     * returns all possible transition, which go from the fromState with the transitionName to a state
     * @param fromState
     * @param transitionName
     * @returns {Array}
     */
    self.getNextTransitions = function (fromState, transitionName, readFromStack) {
        var transitions = [];
        for (var i = 0; i < $scope.config.transitions.length; i++) {
            var transition = $scope.config.transitions[i];
            if (transition.fromState == fromState && transition.name == transitionName && transition.readFromStack == readFromStack) {
                transitions.push(transition);
            }
        }
        return transitions;
    };
    /**
     *  Checks if the automata is playable ( has min. 1 states and 1 transition and automat has a start and a finalstate)
     * @return {Boolean} [description]
     */
    self.isPlayable = function () {
        return $scope.config.states.length >= 1 && $scope.config.transitions.length >= 1 && $scope.config.startState !== null;
    };
}