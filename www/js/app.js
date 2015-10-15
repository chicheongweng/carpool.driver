function getUUID() {
    var d = new Date().getTime();
    var u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return u;
};

function checkConnection() {
    if (window.cordova) {
        var networkState = navigator.connection.type;
        var states = {};
        states[Connection.UNKNOWN]  = false;
        states[Connection.ETHERNET] = true;
        states[Connection.WIFI]     = true;
        states[Connection.CELL_2G]  = true;
        states[Connection.CELL_3G]  = true;
        states[Connection.CELL_4G]  = true;
        states[Connection.CELL]     = true;
        states[Connection.NONE]     = false;
        return states[networkState];
    } else {
        return navigator.onLine;
    };
};

angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova'])

.run(function($ionicPlatform,$state,$rootScope,$window,$cordovaNativeAudio) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    $cordovaNativeAudio.preloadSimple('bell', 'audio/driver.mp3')
    .then(function (msg) {
    console.log(msg);
    }, function (error) {
    alert(error);
    });

    $rootScope.online = checkConnection();
    $window.addEventListener("offline", function () {
        $rootScope.$apply(function() {
            $rootScope.online = false;
        });
    }, false);
    $window.addEventListener("online", function () {
        $rootScope.$apply(function() {
            $rootScope.online = true;
        });
    }, false);

    $rootScope.messages = [];
    $rootScope.socket = null;
    var state = $window.localStorage['state'] || 'tab.account';
    $state.go(state);
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    // setup an abstract state for the tabs directive
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: 'templates/tabs.html',
      controller: 'TabCtrl'
    })

    // Each tab has its own nav history stack:
    .state('tab.dash', {
      url: '/dash',
      views: {
        'tab-dash': {
          templateUrl: 'templates/tab-dash.html',
          controller: 'DashCtrl'
        }
      }
    })

    .state('tab.account', {
      url: '/account',
      views: {
        'tab-account': {
          templateUrl: 'templates/tab-account.html',
          controller: 'AccountCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  // $urlRouterProvider.otherwise('/tab/account');

})

.factory('localstorage', ['$window', function($window) {
    return {
        remove: function(key) {
            $window.localStorage.removeItem(key);
        },
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
            return JSON.parse($window.localStorage[key] || '{}');
        }
    }
}])

.factory('geo', function($http, $cordovaGeolocation) {
    return {
        getAddressFromGeoLocation: function(lat, lng, callback) {
            apiKey = 'AIzaSyAEKs4ZY-sOsDnaq-M27MiOfhWK4dJfDSg';
            url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&location_type=ROOFTOP&result_type=street_address&key='+apiKey;
            $http.get(url).
                success(function(data, status, headers, config) {
                if (data.status=='OK') {
                    address = data.results[0].formatted_address;
                }   
                else {
                    address = "unknown";
                };  
                callback && callback(address);
            }); 
        },  

        getGeoLocation: function(callback, callbackerr) {
            $cordovaGeolocation.getCurrentPosition().then(function(position) {
                var lat = parseFloat(position.coords.latitude);
                var lng = parseFloat(position.coords.longitude);
                callback && callback(lat, lng);
            }, function(err) {
                callbackerr && callbackerr("unable to determine location");
            }); 
        },  
    }   
})

.factory('data', function ($cordovaDevice, $window, geo, $cordovaKeychain, $rootScope) {
    $rootScope.disconnect = 0;
    $rootScope.connect_failed = 0;
    $rootScope.update_geopos = 0;
    $rootScope.address = undefined;
    var URL = 'uber.ratecoworkers.com:8000';
    var device;
    var socket;
    var user = {
        name:$window.localStorage['name'] || undefined,
        phone:$window.localStorage['phone'] || undefined
    }
    var connstate = {
        state:$window.localStorage['connstate'] || 'signout'
    }
    try {
        device = $cordovaDevice.getDevice();
        device.uuid = device.uuid.toLowerCase();
        if (device.platform == 'iOS') {
        console.log("calling $cordovaKeychain");
        $cordovaKeychain.getForKey('uuid','servicename')
        .then(
            function(value) {
            console.log("$cordovaKeychain getForKey succeeded");
            device.uuid = value;
            },
            function(err) {
                console.log("$cordovaKeychain getForKey failed");
                $cordovaKeychain.setForKey('uuid','servicename',device.uuid.toLowerCase())
                .then(function(value) {
                    console.log("$cordovaKeychain setForKey succeeded");
                },
                function(err) {
                    console.log("$cordovaKeychain setForKey failed");
                });
            });
        }
    }
    catch(err) {
        device = {available: true,
            platform: undefined,
            version: undefined,
            uuid: getUUID(),
            cordova: undefined,
            model: undefined
        };
    }; 
    console.log("io.connect "+URL)
    socket = io.connect(URL, {'reconnection limit': 5000, 'max reconnection attempts': Infinity});
    socket.on('connect', function() {
        console.log('connect');
        if (connstate.state == 'signin') {
            var reason = { reason: 'connect' } 
            socket.emit('driver:update', {user:user, device:device, reason:reason});
        }
    });
    socket.on('disconnect', function() {
        console.log('disconnect');
        var int1 = setInterval(function () {
            socket.socket.reconnect();
            if(socket.socket.connected) {
                if (connstate.state == 'signin') {
                    var reason = { reason: 'disconnect' }
                    socket.emit('driver:update', {user:user, device:device, reason:reason});
                    $rootScope.disconnect = $rootScope.disconnect + 1;
                }
                clearInterval(int1);
            }
        }, 3000);
    });
    socket.on('connect_failed', function() {
        console.log('connect_failed');
        var int2 = setInterval(function () {
            socket.socket.reconnect();
            if(socket.socket.connected) {
                if (connstate.state=='signin') {
                    var reason = { reason: 'connect_failed' }
                    socket.emit('driver:update', {user:user, device:device, reason:reason});
                    $rootScope.connect_failed = $rootScope.connect_failed + 1;
                }
                clearInterval(int2);
            }
        }, 3000);
    });
    socket.on('update_geopos_ack', function() {
        console.log('update_geopos_ack');
        $rootScope.update_geopos_ack_ts = Date(Date.now());
    });

    function update_geopos() {
        if(socket.socket.connected) {
            if (connstate.state == 'signin') {
                geo.getGeoLocation(function(lat, lng) {
                    pos = {lat: lat, lng: lng};
                    socket.emit('driver:update_geopos', {pos:pos, device:device});
                    $rootScope.update_geopos = $rootScope.update_geopos + 1;
                    geo.getAddressFromGeoLocation(lat, lng, function(address) {
                        $rootScope.lat = lat;
                        $rootScope.lng = lng;
                        $rootScope.address = address;
                    }); 

                }, function(err) {
                    $rootScope.address = "unknown";
                });
            }
        }
    }

    $rootScope.update_currentpos = function() {
        $rootScope.address = undefined;
        update_geopos();
    }

    update_geopos();
    setInterval(update_geopos, 15000);
    $rootScope.waitforaccept = false;
    
    return {
        device: device,
        user: user,
        URL: URL,
        params: {'reconnection limit': 5000},
        socket: socket,
        connstate: connstate,
        state: $window.localStorage['state'] || 'tab.account',
    };
});
