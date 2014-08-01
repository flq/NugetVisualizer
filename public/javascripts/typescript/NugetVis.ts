/// <reference path="definitelyTyped/rx.js.TypeScript.DefinitelyTyped.0.4.0/Content/Scripts/typings/rx.js/rx.lite.d.ts" />
/// <reference path="definitelyTyped/underscore.TypeScript.DefinitelyTyped.0.4.4/Content/Scripts/typings/underscore/underscore.d.ts" />
/// <reference path="NugetVisPackageTypes.ts" />
module NugetVis {

	declare var OData;

		interface NugetPackage {
		Id : string;
		Version : string;
		Description : string;
	}

	interface RemotePackage extends NugetPackage {
		Dependencies : string;
	}

	interface Dependency {
		Id : string;
		Version : string;
		TargetFw : string;
	}

	interface LocalPackage extends NugetPackage {
		Dependencies : Dependency[];
		loadPackage : (package : LocalPackage) => void
	}	


	class Loader {

		private searchUrlStr = "/Search()?$filter=IsLatestVersion&$skip=0&$top=10&searchTerm='{term}'&includePrerelease=false";
		private loadByIdAndVersion = "Packages()?$filter=Id%20eq%20%27{id}%27%20and%20Version%20eq%20%27{version}%27";
		
		rootUrl : string;

		constructor(theRootUrl : string) {
			this.rootUrl = theRootUrl;
		}

		searchPackages(observableText : Rx.Observable<string>) : Rx.Observable<LocalPackage[]>  {
			
			return Rx.Observable.create((obs : Rx.Observer<LocalPackage[]>) => {
				var dispose = observableText.subscribe((nextText : string) => {
					OData.read({
						requestUri : this.searchUrl(nextText),
						enableJsonpCallback : true
					}, (data, response) => {
						obs.onNext(this.convertRemoteToLocal(data.results));
					});
				});
				return dispose;
			});
		}

		private searchUrl(searchTerm : string) : string {
			return this.rootUrl + this.searchUrlStr.replace("{term}", searchTerm);
		}

		private loadUrl(id : string, version : string) : string {
			return this.rootUrl + this.loadByIdAndVersion.replace("{id}", id).replace("{version}", version);
		}

		private convertRemoteToLocal(packages : RemotePackage[]) : LocalPackage [] {
			return _.map(packages, p => 
			{
				return {
					Id : p.Id,
					Version : p.Version,
					Description : p.Description,
					Dependencies: this.constructDependencies(p.Dependencies),
					loadPackage : p => {} //TODO: Fill with life
				};
			});
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
	}
}