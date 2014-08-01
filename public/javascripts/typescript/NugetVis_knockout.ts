/// <reference path="NugetVis.ts" />
module NugetVis {

	declare var ko;

	ko.observableArray.fn.pushAll = function(valuesToPush) {
	  var underlyingArray = this();
	  this.valueWillMutate();
	  ko.utils.arrayPushAll(underlyingArray, valuesToPush);
	  this.valueHasMutated();
	  return this;
	};
}