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

function fxNuget(results, packageLoadCallback) {
  var url = Handlebars.compile("http://www.nuget.org/api/v2/Search()?$filter=IsLatestVersion&$skip=0&$top=10&searchTerm='{{this}}'&includePrerelease=false")
  var singlePackage = Handlebars.compile("http://www.nuget.org/api/v2/Packages()?$filter=Id%20eq%20%27{{this.Id}}%27%20and%20Version%20eq%20%27{{this.Version}}%27")
  
  var tuneJson = function(package) {
    return {
      id : package.Id,
      name : package.Id + "(" + package.Version + ")",
      data : {},
      children : _.map(package.Dependencies.split("|"), function(text) {
        return { id : text, name : text, data: {}, children: [] };
      })
    }
  }

  var loadPackage = function(item) {
      OData.read(
      {
          requestUri: singlePackage(item),
          enableJsonpCallback: true
      },
      function (data,response) {
        var package = data.results[0];
        packageLoadCallback(tuneJson(package));
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
        results.pushAll(_.map(data.results, function(item) {
          return {
            Id: item.Id,
            Description: item.Description,
            Version: item.Version,
            openPackage: loadPackage
          };
        }));
      });
    }
  };
}