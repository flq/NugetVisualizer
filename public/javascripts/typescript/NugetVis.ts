/// <reference path="definitelyTyped/rx.js.TypeScript.DefinitelyTyped.0.4.0/Content/Scripts/typings/rx.js/rx.lite.d.ts" />
/// <reference path="definitelyTyped/underscore.TypeScript.DefinitelyTyped.0.4.4/Content/Scripts/typings/underscore/underscore.d.ts" />
module NugetVis {

	declare var OData;

	export interface VersionedPackage {
		Id : string;
		Version : string;
	}

	export interface NugetPackage extends VersionedPackage {
		Description : string;
	}

	interface RemotePackage extends NugetPackage {
		Dependencies : string;
	}

	export interface Dependency extends VersionedPackage {
		TargetFw : string;
	}

	export interface LocalPackage extends NugetPackage {
		Dependencies : Dependency[];
		loadPackage : (package : LocalPackage) => void;
		isFirst : boolean;
	}	


	export class Loader {

		private searchUrlStr = "/Search()?$filter=IsLatestVersion&$skip=0&$top=10&searchTerm='{term}'&includePrerelease=false";
		private loadByIdAndVersion = "/Packages()?$filter=Id%20eq%20%27{id}%27%20and%20Version%20eq%20%27{version}%27";
		private loadByIdOnly =  "/Packages()?$filter=Id%20eq%20%27{id}%27";
		
		private rootUrl : string;
		private graphSubject : Rx.Subject<LocalPackage>;

		constructor(theRootUrl : string) {
			this.rootUrl = theRootUrl;
			this.graphSubject = new Rx.Subject<LocalPackage>();
		}

		searchPackages(observableText : Rx.Observable<string>) : Rx.Observable<LocalPackage[]>  {
			
			return Rx.Observable.create((obs : Rx.Observer<LocalPackage[]>) => {
				var dispose = observableText.subscribe((nextText : string) => {
					OData.read({
						requestUri : this.searchUrl(nextText),
						enableJsonpCallback : true
					}, (data, response) => {
						obs.onNext(this.convertRemotesToLocals(data.results));
					});
				});
				return dispose;
			});
		}

		graphFillingStream() : Rx.Observable<LocalPackage> {
			return this.graphSubject;
		}

		private loadPackageDeep(package : LocalPackage) {

			this.graphSubject.onNext(package);

			_.each(package.Dependencies, dep => {
				this.loadPackage(dep, false);
			});
		}

		private loadPackage(package : VersionedPackage, isFirst : boolean) {
			OData.read({
				requestUri : this.loadUrl(package),
				enableJsonpCallback : true
			}, (data, response) => {
				var package = this.convertRemoteToLocal(data.results[0], false);
				this.loadPackageDeep(package);
			});
		}

		private convertRemotesToLocals(packages : RemotePackage[]) : LocalPackage [] {
			return _.map(packages, p => this.convertRemoteToLocal(p));
		}

		private convertRemoteToLocal(p : RemotePackage, isFirst : boolean = true) : LocalPackage {
			return {
					Id : p.Id,
					Version : p.Version,
					Description : p.Description,
					Dependencies: this.constructDependencies(p.Dependencies),
					loadPackage : this.loadPackageDeep,
					isFirst : isFirst
				};
		}

		private constructDependencies(dependencies : string) : Dependency[] {
			if (dependencies == "") {
				return [];
			}

			return _.map(dependencies.split("|"), text => {
				var parts = text.split(":");
				return {
					Id: parts[0],
					Version: this.extractLowerVersion(parts[1]),
					TargetFw: parts[2]
				};
			});
		}

		private extractLowerVersion(versionRange : string) : string {
			var r = /\d+\.\d+(\.\d+)?(\.\d+)?/
			var match = r.exec(versionRange)
			return match != null ? match[0] : "";
		}

		private searchUrl(searchTerm : string) : string {
			return this.rootUrl + this.searchUrlStr.replace("{term}", searchTerm);
		}

		private loadUrl(package : VersionedPackage) : string {
			return this.rootUrl + 
			package.Version != "" ?
			this.loadByIdAndVersion.replace("{id}", package.Id).replace("{version}", package.Version) :
			this.loadByIdOnly.replace("{id}", package.Id);
		}

	}
}