/// <reference path="definitelyTyped/rx.js.TypeScript.DefinitelyTyped.0.4.0/Content/Scripts/typings/rx.js/rx.lite.d.ts" />
/// <reference path="definitelyTyped/underscore.TypeScript.DefinitelyTyped.0.4.4/Content/Scripts/typings/underscore/underscore.d.ts" />
var NugetVis;
(function (NugetVis) {
    var Loader = (function () {
        function Loader(theRootUrl) {
            this.searchUrlStr = "/Search()?$filter=IsLatestVersion&$skip=0&$top=10&searchTerm='{term}'&includePrerelease=false";
            this.loadByIdAndVersion = "/Packages()?$filter=Id%20eq%20%27{id}%27%20and%20Version%20eq%20%27{version}%27";
            this.rootUrl = theRootUrl;
        }
        Loader.prototype.searchPackages = function (observableText) {
            var _this = this;
            return Rx.Observable.create(function (obs) {
                var dispose = observableText.subscribe(function (nextText) {
                    OData.read({
                        requestUri: _this.searchUrl(nextText),
                        enableJsonpCallback: true
                    }, function (data, response) {
                        obs.onNext(_this.convertRemoteToLocal(data.results));
                    });
                });
                return dispose;
            });
        };

        Loader.prototype.searchUrl = function (searchTerm) {
            return this.rootUrl + this.searchUrlStr.replace("{term}", searchTerm);
        };

        Loader.prototype.loadUrl = function (id, version) {
            return this.rootUrl + this.loadByIdAndVersion.replace("{id}", id).replace("{version}", version);
        };

        Loader.prototype.convertRemoteToLocal = function (packages) {
            var _this = this;
            return _.map(packages, function (p) {
                return {
                    Id: p.Id,
                    Version: p.Version,
                    Description: p.Description,
                    Dependencies: _this.constructDependencies(p.Dependencies),
                    loadPackage: function (p) {
                    }
                };
            });
        };

        Loader.prototype.constructDependencies = function (dependencies) {
            var _this = this;
            if (dependencies == "") {
                return [];
            }

            return _.map(dependencies.split("|"), function (text) {
                var parts = text.split(":");
                return {
                    Id: parts[0],
                    Version: _this.extractLowerVersion(parts[1]),
                    TargetFw: parts[2]
                };
            });
        };

        Loader.prototype.extractLowerVersion = function (versionRange) {
            var r = /\d+\.\d+(\.\d+)?(\.\d+)?/;
            var match = r.exec(versionRange);
            return match != null ? match[0] : "";
        };
        return Loader;
    })();
    NugetVis.Loader = Loader;
})(NugetVis || (NugetVis = {}));
/// <reference path="NugetVis.ts" />
var NugetVis;
(function (NugetVis) {
    ko.observableArray.fn.pushAll = function (valuesToPush) {
        var underlyingArray = this();
        this.valueWillMutate();
        ko.utils.arrayPushAll(underlyingArray, valuesToPush);
        this.valueHasMutated();
        return this;
    };
})(NugetVis || (NugetVis = {}));
/// <reference path="definitelyTyped/rx.js.TypeScript.DefinitelyTyped.0.4.0/Content/Scripts/typings/rx.js/rx.lite.d.ts" />
/// <reference path="NugetVis.ts" />
var NugetVis;
(function (NugetVis) {
    function asStream(textfield) {
        return Rx.Observable.fromEvent(textfield, 'keyup').map(function (e) {
            return e.target.value;
        }).filter(function (text) {
            return text.length > 2;
        }).throttle(400).distinctUntilChanged();
    }
    NugetVis.asStream = asStream;
})(NugetVis || (NugetVis = {}));
