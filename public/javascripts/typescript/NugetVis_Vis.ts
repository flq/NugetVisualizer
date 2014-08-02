/// <reference path="NugetVis.ts" />
/// <reference path="definitelyTyped/rx.js.TypeScript.DefinitelyTyped.0.4.0/Content/Scripts/typings/rx.js/rx.lite.d.ts" />
/// <reference path="definitelyTyped/underscore.TypeScript.DefinitelyTyped.0.4.4/Content/Scripts/typings/underscore/underscore.d.ts" />
module NugetVis {

	declare var vis;

	interface Node {
		id : number;
		label : string;
		version : string;
	}

	interface Edge {
		id : number;
		from : number;
		to : number;
		label : string;
	}

	interface NetFragment {
		nodes : Node[];
		edges : Edge[];
		isFirstFragment : boolean;
	}

	export class VisAdapter {
		
		private net : { nodes; edges };
		private network;

		constructor(container) {

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
						centralGravity: 0.1,
						nodeDistance: 200
					}
				}
			};

			this.net = {
				nodes: new vis.DataSet(),
				edges: new vis.DataSet(),
        			};

        			this.network = new vis.Network(container, this.net, options);
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

		private nodesFromDependencies(deps : Dependency[]) : Node[] {
			return _.map(deps, item => {
				return {
					id: this.hashCode(item.Id),
					label: item.Id,
					version: item.Version
				};
			});
		}

		private updateNet(netFragment : NetFragment) {
			if (netFragment.isFirstFragment) {
				this.net.nodes.clear();
				this.net.edges.clear();
			}
			// Haha, using _.each tripped up the this mapping somewhere inside
			// vis.js
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
		}
	}
}