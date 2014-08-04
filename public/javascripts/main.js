/// <reference path="definitelyTyped/rx.js.TypeScript.DefinitelyTyped.0.4.0/Content/Scripts/typings/rx.js/rx.lite.d.ts" />
/// <reference path="definitelyTyped/underscore.TypeScript.DefinitelyTyped.0.4.4/Content/Scripts/typings/underscore/underscore.d.ts" />
var NugetVis;
(function (NugetVis) {
    var Loader = (function () {
        function Loader(theRootUrl) {
            this.searchUrlStr = "/Search()?$filter=IsLatestVersion&$skip=0&$top=10&searchTerm='{term}'&includePrerelease=false";
            this.loadByIdAndVersion = "/Packages()?$filter=Id%20eq%20%27{id}%27%20and%20Version%20eq%20%27{version}%27";
            this.loadByIdOnly = "/Packages()?$filter=Id%20eq%20%27{id}%27";
            this.rootUrl = theRootUrl;
            this.graphSubject = new Rx.Subject();
        }
        Loader.prototype.searchPackages = function (observableText) {
            var _this = this;
            return Rx.Observable.create(function (obs) {
                var dispose = observableText.subscribe(function (nextText) {
                    OData.read({
                        requestUri: _this.searchUrl(nextText),
                        enableJsonpCallback: true
                    }, function (data, response) {
                        obs.onNext(_this.convertRemotesToLocals(data.results));
                    });
                });
                return dispose;
            });
        };

        Loader.prototype.graphFillingStream = function () {
            return this.graphSubject;
        };

        Loader.prototype.loadPackageDeep = function (package) {
            var _this = this;
            this.graphSubject.onNext(package);

            _.each(package.Dependencies, function (dep) {
                _this.loadPackage(dep, false);
            });
        };

        Loader.prototype.loadPackage = function (package, isFirst) {
            var _this = this;
            OData.read({
                requestUri: this.loadUrl(package),
                enableJsonpCallback: true
            }, function (data, response) {
                if (data.results.length == 0) {
                    return;
                }
                var package = _this.convertRemoteToLocal(data.results[0], false);
                _this.loadPackageDeep(package);
            });
        };

        Loader.prototype.convertRemotesToLocals = function (packages) {
            var _this = this;
            return _.map(packages, function (p) {
                return _this.convertRemoteToLocal(p);
            });
        };

        Loader.prototype.convertRemoteToLocal = function (p, isFirst) {
            var _this = this;
            if (typeof isFirst === "undefined") { isFirst = true; }
            return {
                Id: p.Id,
                Version: p.Version,
                Description: p.Description,
                Dependencies: this.constructDependencies(p.Dependencies),
                loadPackage: function (p) {
                    return _this.loadPackageDeep(p);
                },
                isFirst: isFirst
            };
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

        Loader.prototype.searchUrl = function (searchTerm) {
            return this.rootUrl + this.searchUrlStr.replace("{term}", searchTerm);
        };

        Loader.prototype.loadUrl = function (package) {
            return this.rootUrl + (package.Version != "" ? this.loadByIdAndVersion.replace("{id}", package.Id).replace("{version}", package.Version) : this.loadByIdOnly.replace("{id}", package.Id));
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
/// <reference path="NugetVis.ts" />
/// <reference path="definitelyTyped/rx.js.TypeScript.DefinitelyTyped.0.4.0/Content/Scripts/typings/rx.js/rx.lite.d.ts" />
/// <reference path="definitelyTyped/underscore.TypeScript.DefinitelyTyped.0.4.4/Content/Scripts/typings/underscore/underscore.d.ts" />
var NugetVis;
(function (NugetVis) {
    var VisAdapter = (function () {
        function VisAdapter(container, packageGraph) {
            var _this = this;
            var options = {
                nodes: {
                    shape: 'box'
                },
                edges: {
                    style: 'arrow',
                    color: 'green'
                },
                physics: {
                    repulsion: {
                        nodeDistance: 200
                    }
                }
            };

            this.net = {
                nodes: new vis.DataSet(),
                edges: new vis.DataSet()
            };

            this.network = new vis.Network(container, this.net, options);

            packageGraph.subscribe(function (p) {
                return _this.incorporatePackageInGraph(p);
            });
        }
        VisAdapter.prototype.incorporatePackageInGraph = function (package) {
            var _this = this;
            var node = this.toNode(package, true);
            var deps = _.map(package.Dependencies, function (dep) {
                return _this.toNode(dep);
            });
            var edges = _.map(deps, function (d) {
                return {
                    id: node.id + d.id,
                    from: node.id,
                    to: d.id,
                    label: d.version
                };
            });
            this.updateNet({
                nodes: [node].concat(deps),
                edges: edges,
                isFirstFragment: package.isFirst
            });
        };

        VisAdapter.prototype.toNode = function (package, showVersion) {
            if (typeof showVersion === "undefined") { showVersion = false; }
            return {
                id: this.hashCode(package.Id),
                label: showVersion ? (package.Id + " (" + package.Version + ")") : package.Id,
                version: package.Version
            };
        };

        VisAdapter.prototype.updateNet = function (netFragment) {
            if (netFragment.isFirstFragment) {
                this.net.nodes.clear();
                this.net.edges.clear();
            }

            for (var i = 0; i < netFragment.nodes.length; i++) {
                var newNode = netFragment.nodes[i];
                if (this.net.nodes.get(newNode.id) === null) {
                    this.net.nodes.add(newNode);
                }
            }
            for (var i = 0; i < netFragment.edges.length; i++) {
                var newEdge = netFragment.edges[i];
                if (this.net.edges.get(newEdge.id) === null) {
                    this.net.edges.add(newEdge);
                }
            }
        };

        VisAdapter.prototype.hashCode = function (str) {
            var hash = 0, i, chr, len;
            if (str.length == 0)
                return hash;
            for (i = 0, len = str.length; i < len; i++) {
                chr = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        };
        return VisAdapter;
    })();
    NugetVis.VisAdapter = VisAdapter;
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
