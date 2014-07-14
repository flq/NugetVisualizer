ko.observableArray.fn.pushAll = function(valuesToPush) {
          var underlyingArray = this();
          this.valueWillMutate();
          ko.utils.arrayPushAll(underlyingArray, valuesToPush);
          this.valueHasMutated();
          return this;
      };


function asStream(textfield) {
  return Rx.Observable.fromEvent(textfield, 'keyup')
        .map(function(e) {
          return e.target.value;
        }) 
        .filter(function(text) {
          return text.length > 2;
        })
        .throttle(500)
        .distinctUntilChanged();
};

function packageToNet(package) {

  function hashCode(str) {
    var hash = 0, i, chr, len;
    if (str.length == 0) return hash;
    for (i = 0, len = str.length; i < len; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };
  
  var root = {
    id : hashCode(package.Id),
    label : package.Id + "(" + package.Version + ")"
  };

  var childNodes = _.map(package.Dependencies, function(item) {
      return { id : hashCode(item.id), label : item.id, version : item.version };
  });

  var edges = _.map(childNodes, function(cn) {
    return { from: root.id, to: cn.id, label: cn.version };
  });

  return {
    nodes: [root].concat(childNodes),
    edges: edges
  };
}


function fxNuget(results, packageLoadCallback) {
  var url = Handlebars.compile("http://www.nuget.org/api/v2/Search()?$filter=IsLatestVersion&$skip=0&$top=10&searchTerm='{{this}}'&includePrerelease=false")
  var singlePackage = Handlebars.compile("http://www.nuget.org/api/v2/Packages()?$filter=Id%20eq%20%27{{this.Id}}%27%20and%20Version%20eq%20%27{{this.Version}}%27")
  
    var structureDependencies = function(dependencies) {
      if (dependencies == "") {
        return [];
      }
      return _.map(dependencies.split("|"), function(text) {
          var parts = text.split(":");
          return { id : parts[0], version : parts[1], targetFw : parts[2] };
      });      
    };

    var toPackageStructure = function(odataPackage) {
      return {
            Id: odataPackage.Id,
            Description: odataPackage.Description,
            Version: odataPackage.Version,
            Dependencies: structureDependencies(odataPackage.Dependencies)
          };
    };

    var loadPackage = function(item) {
      OData.read(
      {
          requestUri: singlePackage(item),
          enableJsonpCallback: true
      },
      function (data,response) {
        var package = toPackageStructure(data.results[0]);
        packageLoadCallback(packageToNet(package));
      });
    };

  return {
    searchPackages: function(text) {
      OData.read(
      {
          requestUri: url(text),
          enableJsonpCallback: true
      },
      function (data,response) {
        results.removeAll();
        results.pushAll(_.map(data.results, function(p) { 
          return _.extend(toPackageStructure(p), { openPackage: loadPackage }) }));
      });
    }
  };
}