//PDA
function PDA($scope, $translate) {
    "use strict";

    var self = this;
    DFA.apply(this, arguments);

    $scope.defaultConfig.stackFirstSymbol = "#";
    $scope.defaultConfig.stack = [$scope.defaultConfig.stackFirstSymbol];

    //Config Object
    $scope.config = cloneObject($scope.defaultConfig);


    /**Overrides**/
    //the statediagram controlling the svg diagramm
    $scope.simulator = new SimulationPDA($scope);
    //the statediagram controlling the svg diagramm
    $scope.statediagram = new StateDiagramPDA($scope, "#diagramm-svg");
    // the table where states and transitions are shown
    $scope.table = new TablePDA($scope);




    $scope.pushOnStack = function (char) {
        $scope.config.stack.push(char);

    };


    $scope.popFromStack = function (char) {

    };


    //TRANSITION OVERRIDES

    /**
     * Checks if a transition with the params already exists
     * @param  {number}  fromState      Id of the fromstate
     * @param  {number}  toState        id from the toState
     * @param  {Strin}  transitonName The name of the transition
     * @return {Boolean}                
     */
    $scope.existsTransition = function (fromState, toState, char, readFromStack, writeToStack, transitionId) {
        var tmp = false;
        for (var i = 0; i < $scope.config.transitions.length; i++) {
            var transition = $scope.config.transitions[i];
            if (transition.fromState == fromState && transition.name == char && transition.id !== transitionId && transition.readFromStack == readFromStack && transition.writeToStack == writeToStack) {
                tmp = true;
            }
        }
        return tmp;
    };

    $scope.getNextTransitionName = function (fromState) {
        var namesArray = [];
        for (var i = 0; i < $scope.config.transitions.length; i++) {
            if ($scope.config.transitions[i].fromState == fromState) {
                namesArray.push($scope.config.transitions[i].name);
            }
        }
        var foundNextName = false;
        var tryChar = "a";
        while (!foundNextName) {
            var value = _.indexOf(namesArray, tryChar);
            if (value === -1) {
                foundNextName = true;
            } else {
                tryChar = String.fromCharCode(tryChar.charCodeAt() + 1);
            }
        }
        return tryChar;

    };

    /**
     * Adds a transition at the end of the transitions array
     * @param {number} fromState      The id from the fromState
     * @param {number} toState        The id from the toState
     * @param {String} transistonName The name of the Transition
     */
    $scope.addTransition = function (fromState, toState, char, readFromStack, writeToStack) {
        //can only create the transition if it is unique-> not for the ndfa
        //there must be a fromState and toState, before adding a transition
        if (!$scope.existsTransition(fromState, toState, char) && $scope.existsStateWithId(fromState) &&
            $scope.existsStateWithId(toState)) {
            $scope.addToAlphabet(char);
            return $scope.addTransitionWithId($scope.config.countTransitionId++, fromState, toState, char, readFromStack, writeToStack);

        } else {
            //TODO: BETTER DEBUG
        }
    };

    /**
     * Adds a transition at the end of the transitions array -> for import 
     * !!!dont use at other places!!!!! ONLY FOR IMPORT
     * @param {number} fromState      The id from the fromState
     * @param {number} toState        The id from the toState
     * @param {String} transistonName The name of the Transition
     */
    $scope.addTransitionWithId = function (transitionId, fromState, toState, char, readFromStack, writeToStack) {
        $scope.config.transitions.push(new TransitionPDA(transitionId, fromState, toState, char, readFromStack, writeToStack));
        //drawTransistion
        $scope.statediagram.drawTransition(transitionId);
        $scope.updateListener();
        //fix changes wont update after addTransisiton from the statediagram
        $scope.safeApply();
        return $scope.getTransitionById(transitionId);
    };

    /**
     * Get the array index from the transition with the given transitionId
     * @param  {number} transitionId 
     * @return {number}         Returns the index and -1 when state with transistionId not found
     */
    $scope.getArrayTransitionIdByTransitionId = function (transitionId) {
        return _.findIndex($scope.config.transitions, function (transition) {
            if (transition.id == transitionId) {
                return transition;
            }
        });
    };

    /**
     * Returns the transition of the given transitionId
     * @param  {number} transitionId 
     * @return {object}        Returns the objectreference of the state
     */
    $scope.getTransitionById = function (transitionId) {
        return $scope.config.transitions[$scope.getArrayTransitionIdByTransitionId(transitionId)];
    };

    /**
     * Checks if a transition with the params already exists
     * @param  {number}  fromState      Id of the fromstate
     * @param  {number}  toState        id from the toState
     * @param  {Strin}  transitonName The name of the transition
     * @return {Boolean}                
     */
    $scope.getTransition = function (fromState, toState, char, readFromStack, writeToStack) {
        for (var i = 0; i < $scope.config.transitions.length; i++) {
            var transition = $scope.config.transitions[i];
            if (transition.fromState == fromState && transition.toState == toState && transition.name == char && transition.readFromStack == readFromStack && transition.writeToStack == writeToStack) {
                return transition;
            }
        }
        return undefined;
    };


    /**
     * Removes the transistion
     * @param {number} transitionId      The id from the transition
     */
    $scope.removeTransition = function (transitionId) {
        //remove old transition from alphabet if this transition only used this char
        $scope.removeFromAlphabetIfNotUsedFromOthers(transitionId);
        //first remove the element from the svg after that remove it from the array
        $scope.statediagram.removeTransition(transitionId);
        $scope.config.transitions.splice($scope.getArrayTransitionIdByTransitionId(transitionId), 1);
        //update other listeners when remove is finished
        $scope.updateListener();
    };

    /**
     * Renames a transition if is uniqe with the new name
     * @param  {number} transitionId     
     * @param  {String} newTransitionName 
     */
    $scope.renameTransition = function (transitionId, newTransitionName) {
        var transition = $scope.getTransitionById(transitionId);
        if (!$scope.existsTransition(transition.fromState, transition.toState, newTransitionName)) {
            var tmpTransition = $scope.getTransitionById(transitionId);
            //remove old transition from alphabet if this transition only used this char
            $scope.removeFromAlphabetIfNotUsedFromOthers(transitionId);
            //add new transitionname to the alphabet
            $scope.addToAlphabet(newTransitionName);
            //save the new transitionname
            $scope.getTransitionById(transitionId).name = newTransitionName;
            //Rename the state on the statediagram
            $scope.statediagram.renameTransition(transition.fromState, transition.toState, transitionId, newTransitionName);
            $scope.updateListener();
            return true;
        } else {
            //TODO: BETTER DEBUG
            return false;
        }
    };
}
//Simulator for the simulation of the PDA
function SimulationPDA($scope) {
    "use strict";

    var self = this;
    SimulationDFA.apply(self, arguments);

}
//statediagram for the PDA
function StateDiagramPDA($scope, svgSelector) {
    "use strict";

    var self = this;
    StateDiagramDFA.apply(self, arguments);

    self.drawStack = function () {

    };

}
//statediagram for the PDA
function StatetransitionfunctionPDA($scope) {
    "use strict";

    var self = this;
    StatetransitionfunctionDFA.apply(self, arguments);

}
//statediagram for the PDA
function TablePDA($scope) {
    "use strict";

    var self = this;
    TableDFA.apply(self, arguments);

}