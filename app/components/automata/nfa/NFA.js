//NFA
function NFA($scope, $translate) {
    "use strict";
    DFA.apply(this, arguments);

    /**Overwriting**/
    $scope.defaultConfig.type = "NFA";
    //Config Object
    $scope.config = _.cloneDeep($scope.defaultConfig);
    $scope.portation = new PortationDFA($scope, "NFA");


    /**
     * Checks if a transition with the params already exists
     * @param  {number}  fromState      Id of the fromState
     * @param  {number}  toState        id from the toState
     * @param  {String}  transitionName The name of the transition
     * @param transitionId
     * @return {Boolean}
     */
    $scope.existsTransition = function (fromState, toState, transitionName, transitionId) {
        var tmp = false;
        _.forEach($scope.config.transitions, function (transition) {
            if (transition.fromState == fromState && transition.name == transitionName && transition.toState == toState && transition.id !== transitionId) {
                tmp = true;
                return false;
            }
        });
        return tmp;
    };

}