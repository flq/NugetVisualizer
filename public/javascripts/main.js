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
    .throttle(400)
    .distinctUntilChanged();
};

function packageToNet(package) {

  function hashCode(str) {
    var hash = 0,
      i, chr, len;
    if (str.length == 0) return hash;
    for (i = 0, len = str.length; i < len; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  var root = {
    id: hashCode(package.Id),
    label: package.Id + "(" + package.Version + ")"
  };

  var childNodes = _.map(package.Dependencies, function(item) {
    return {
      id: hashCode(item.Id),
      label: item.Id,
      version: item.Version
    };
  });

  var edges = _.map(childNodes, function(cn) {
    return {
      id: root.id + cn.id,
      from: root.id,
      to: cn.id,
      label: cn.version
    };
  });

  return {
    nodes: [root].concat(childNodes),
    edges: edges
  };
}


function fxNuget(results, packageLoadCallback) {
  var url = Handlebars.compile("http://www.nuget.org/api/v2/Search()?$filter=IsLatestVersion&$skip=0&$top=10&searchTerm='{{this}}'&includePrerelease=false")
  var singlePackage = Handlebars.compile("http://www.nuget.org/api/v2/Packages()?$filter=Id%20eq%20%27{{this.Id}}%27%20and%20Version%20eq%20%27{{this.Version}}%27")
  var singlePackageWoVersion = Handlebars.compile("http://www.nuget.org/api/v2/Packages()?$filter=Id%20eq%20%27{{this.Id}}%27")

  var extractLowerVersion = function(version) {
    var r = /\d+\.\d+(\.\d+)?(\.\d+)?/
    var match = r.exec(version)
    return match != null ? match[0] : "";
  };

  var structureDependencies = function(dependencies) {

    if (dependencies == "") {
      return [];
    }

    return _.map(dependencies.split("|"), function(text) {
      var parts = text.split(":");
      return {
        Id: parts[0],
        Version: extractLowerVersion(parts[1]),
        targetFw: parts[2]
      };
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

  var loadPackage = function(item, isFirst) {
    if (!_.isBoolean(isFirst)) {
      isFirst = true;
    }
    OData.read({
        requestUri: item.Version != "" ? singlePackage(item) : singlePackageWoVersion(item),
        enableJsonpCallback: true
      },
      function(data, response) {
        var package = toPackageStructure(data.results[data.results.length - 1]);
        packageLoadCallback(packageToNet(package), isFirst);
        _.each(package.Dependencies, function(childPackage) {
          loadPackage(childPackage, false);
        })
      });
  };

  return {
    searchPackages: function(text) {
      OData.read({
          requestUri: url(text),
          enableJsonpCallback: true
        },
        function(data, response) {
          results.removeAll();
          results.pushAll(_.map(data.results, function(p) {
            return _.extend(toPackageStructure(p), {
              openPackage: loadPackage
            })
          }));
        });
    }
  };
}