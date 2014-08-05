/// <reference path="NugetVis.ts" />
/// <reference path="definitelyTyped/rx.js.TypeScript.DefinitelyTyped.0.4.0/Content/Scripts/typings/rx.js/rx.lite.d.ts" />
/// <reference path="definitelyTyped/underscore.TypeScript.DefinitelyTyped.0.4.4/Content/Scripts/typings/underscore/underscore.d.ts" />
module NugetVis {

	declare var vis;

	interface HasId {
		id : number;
	}

	interface Node extends HasId {
		label : string;
		version : string;
	}

	interface Edge extends HasId {
		from : number;
		to : number;
		label? : string;
	}

	interface NetFragment {
		nodes : Node[];
		edges : Edge[];
		isFirstFragment : boolean;
	}

	export class VisAdapter {
		
		private net : { nodes; edges };
		private network;

		constructor(container, packageGraph : Rx.Observable<LocalPackage>) {

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
				edges: new vis.DataSet(),
        			};

        			this.network = new vis.Network(container, this.net, options);

        			packageGraph.subscribe(p => this.incorporatePackageInGraph(p));
		}

		private incorporatePackageInGraph(package : LocalPackage) {
			var node : Node = this.toNode(package, true);
			var deps : Node[] = _.map(package.Dependencies, dep => this.toNode(dep));
			var edges : Edge[] = _.map(deps, d => {
				return {
					id : node.id + d.id,
					from : node.id,
					to : d.id,
					label : d.version
				}
			});
			this.updateNet({
				nodes : [node].concat(deps),
				edges : edges,
				isFirstFragment : package.isFirst
			});
		}

		private toNode(package : VersionedPackage, showVersion : boolean = false) : Node {
			return {
				id : this.hashCode(package.Id),
				label :  showVersion ? (package.Id + " (" + package.Version + ")") : package.Id,
				version : package.Version
			};
		}

		private updateNet(netFragment : NetFragment) {
			
			if (netFragment.isFirstFragment) {
				this.net.nodes.clear();
				this.net.edges.clear();
			}
			
			_.each(netFragment.nodes, n => {
				this.addIfNotAlreadyPresent(this.net.nodes, n);
			});

			_.each(netFragment.edges, e => {
				this.addIfNotAlreadyPresent(this.net.edges, e);
			});
		}

		private addIfNotAlreadyPresent(dataSet, item : HasId) {
			if (dataSet.get(item.id) === null) {
				dataSet.add(item);
			}
		}

		private hashCode(str : string) : number {
			var hash = 0, i, chr, len;
			if (str.length == 0) return hash;
			for (i = 0, len = str.length; i < len; i++) {
				chr = str.charCodeAt(i);
				hash = ((hash << 5) - hash) + chr;
				hash |= 0; // Convert to 32bit integer
			}
			return hash;
		}
	}
}