module NugetVisualizer {

	declare var Rx;

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

		private search = "/Search()?$filter=IsLatestVersion&$skip=0&$top=10&searchTerm='{term}'&includePrerelease=false";
		private loadByIdAndVersion = "Packages()?$filter=Id%20eq%20%27{id}%27%20and%20Version%20eq%20%27{version}%27";
		
		rootUrl : string;

		constructor(theRootUrl : string) {
			this.rootUrl = theRootUrl;
		}

		subscribeToSearchText(observableText)  {
			// Here I would like to map the
			// observable text to an observable result set.
		}

		private searchUrl(searchTerm : string) : string {
			return this.rootUrl + this.search.replace("{term}", searchTerm);
		}

		private loadUrl(id : string, version : string) : string {
			return this.rootUrl + this.loadByIdAndVersion.replace("{id}", id).replace("{version}", version);
		}
	}
}