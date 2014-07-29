/// <reference path="NugetVisualizer.ts" />
module NugetVisualizer {

	declare var Rx;

	export function asStream(textfield) {
		return Rx.Observable.fromEvent(textfield, 'keyup')
			.map((e) => e.target.value)
			.filter((text) => text.length > 2)
			.throttle(400)
			.distinctUntilChanged();
	}
}