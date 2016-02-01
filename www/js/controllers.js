angular.module('starter.controllers',[])
.controller('TabCtrl',function($scope,data){
    $scope.isSignIn=function() {
        return data.connstate.state=='signin';
    }
})
.controller('AccountCtrl',function($scope,$rootScope,$state,data,$cordovaDevice,localstorage, $cordovaOauth, LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, $http, LINKEDIN_OAUTH_URL){
    localstorage.set('state','tab.account');
    $scope.device = data.device;
    $scope.user = {};

    if (data.user.name) {
        $scope.user.name = data.user.name;
    }
    if (data.user.phone) {
        $scope.user.phone = data.user.phone;
    }
    $scope.state = $state;
    if (!data.uuid) {
        data.uuid = getUUID();
    }
    $scope.uuid = data.uuid;

    $scope.signin=function(){
        console.log("signing in ...");
        console.log("LINKEDIN_CLIENT_ID = "+LINKEDIN_CLIENT_ID);
        console.log("LINKEDIN_CLIENT_SECRET = "+LINKEDIN_CLIENT_SECRET);
        if (!$scope.user.phone) {
            return;
        }
        $cordovaOauth.linkedin(LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, ["r_basicprofile"], "0x12345").then(
        function(result) {
            console.log("LinkedIn Login Successful");
            var access_token = result.access_token;
            var expire_date = result.expires_in;

            $http.get(LINKEDIN_OAUTH_URL,
                {headers: {"Authorization": "Bearer "+result.access_token}
            }).then(
            function(retdata) {
                data.user.name = retdata.data.firstName + ' ' + retdata.data.lastName;
                data.user.phone = $scope.user.phone;
                $scope.user.name = data.user.name;
                data.connstate.state='signin';
                localstorage.set('name', data.user.name);
                localstorage.set('phone', data.user.phone);
                localstorage.set('connstate',data.connstate.state);
                data.socket.emit('driver:signin', {user:$scope.user, device:data.device});
                $state.go('tab.dash');
            },
            function(retdata) {
            });
        },
        function(data, status) {
            console.log("LinkedIn Login Failed");
        });

        /*
        data.user.name=$scope.user.name;
        data.user.phone=$scope.user.phone;
        data.connstate.state = 'signin';
        localstorage.set('name', data.user.name);
        localstorage.set('phone', data.user.phone);
        localstorage.set('connstate',data.connstate.state);
        data.socket.emit('driver:signin', {user:$scope.user, device:data.device});
        $state.go('tab.dash');
        */
    }
    $scope.signout=function(){
        $rootScope.messages = [];
        data.socket.emit('driver:signout', {user:$scope.user, device:data.device});
        data.connstate.state = 'signout';
        localstorage.remove('state');
        localstorage.remove('connstate');
    }
    $scope.isSignIn=function(){
        return data.connstate.state == 'signin';
    }
})
.controller('DashCtrl',function($scope,$rootScope,$state,data,localstorage,geo,$timeout,$cordovaNativeAudio){
    localstorage.set('state','tab.dash');
    $scope.state = $state;
    $scope.device = data.device;
    $scope.name = data.user.name;
    $scope.phone = data.user.phone;

    geo.getGeoLocation(function(lat, lng){
        geo.getAddressFromGeoLocation(lat, lng, function(address) {
            $scope.lat = lat;
            $scope.lng = lng;
            $scope.address = address;
        });
    }, function(err) {
        $scope.address = "unknown";
    });

    if (data.socket && !data.requestlistenerAdded) {
        data.socket.on('request',function(data, callback){
            $rootScope.secondsremaining = 30;
            $rootScope.waitforaccept = true;
            $rootScope.onTimeout = function(){
                $rootScope.secondsremaining--;
                if ($rootScope.secondsremaining==0) {
                    $rootScope.waitforaccept = false;
                    $timeout.cancel($rootScope.mytimeout);
                    data.date = Date();
                    data.accepted = false;
                    $rootScope.messages.unshift(data);
                    callback(false);
                }
                else {
                    $rootScope.mytimeout = $timeout($rootScope.onTimeout,1000);
                }
            }
            $rootScope.mytimeout = $timeout($rootScope.onTimeout,1000);
            $rootScope.accept = function(){
                $rootScope.waitforaccept = false;
                $timeout.cancel($rootScope.mytimeout);
                $rootScope.secondsremaining = 0;
                data.date = Date();
                data.accepted = true;
                $rootScope.messages.unshift(data);
                callback(true);
            }
            data.date = Date();
            $rootScope.newrequest = data;
            /* 
            $rootScope.$apply(function(){
                data.date = Date();
                $rootScope.messages.unshift(data);
            }); 
            */ 
            $cordovaNativeAudio.play('driver');
        });     
        data.requestlistenerAdded = true;
    }
})

.controller('MapCtrl', function($scope, $http, localstorage, data, geo) {
    localstorage.set('state','tab.map');
    $scope.msg = "";
    $scope.coords = [0,0];
    $scope.mapVisible = true;

    var updateCenter = function(lat, lng) {
        /*var mapOptions = {
            center: new google.maps.LatLng(0,0),
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };*/
        $scope.map.setCenter(new google.maps.LatLng(lat, lng));
        $scope.map.setZoom(16);
        $scope.centerLat = lat;
        $scope.centerLng = lng;
        $scope.mapVisible =true;
    };

    var updateMarker = function(lat, lng, map) {
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat,lng),
            map: map,
            title: 'Current Location'
        });
    };

    var init = function () {
        var mapOptions = {};
        var map = new google.maps.Map(document.getElementById("map"), mapOptions);
        $scope.map = map;
        geo.getGeoLocation(function(lat, lng){
            $scope.msg = lat + ":" + lng;
            updateCenter(lat, lng);
            updateMarker(lat, lng, map);
            geo.getAddressFromGeoLocation(lat, lng, function(address) {
                $scope.address = address;
            });
        }, function(err) {
            $scope.msg = err;
            $scope.address = "unknown";
        });
    };

    init();
});
