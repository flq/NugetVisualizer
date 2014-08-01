/// <reference path="definitelyTyped/rx.js.TypeScript.DefinitelyTyped.0.4.0/Content/Scripts/typings/rx.js/rx.lite.d.ts" />
/// <reference path="NugetVis.ts" />
module NugetVis {

	export function asStream(textfield) : Rx.Observable<string> {
		return Rx.Observable.fromEvent(textfield, 'keyup')
			.map((e : any) => e.target.value)
			.filter((text) => text.length > 2)
			.throttle(400)
			.distinctUntilChanged();
	}
}