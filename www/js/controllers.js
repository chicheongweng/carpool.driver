angular.module('starter.controllers',[])
.controller('TabCtrl',function($scope,data){
    $scope.isSignIn=function() {
        return data.connstate.state=='signin';
    }
})
.controller('AccountCtrl',function($scope,$rootScope,$state,data,$cordovaDevice,localstorage){
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
        if (!$scope.user.name||!$scope.user.phone) {
            return;
        }
        data.user.name=$scope.user.name;
        data.user.phone=$scope.user.phone;
        data.connstate.state = 'signin';
        localstorage.set('name', data.user.name);
        localstorage.set('phone', data.user.phone);
        localstorage.set('connstate',data.connstate.state);
        data.socket.emit('driver:signin', {user:$scope.user, device:data.device});
        $state.go('tab.dash');
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
    /*
    geo.getGeoLocation(function(lat, lng){
        geo.getAddressFromGeoLocation(lat, lng, function(address) {
            $scope.lat = lat;
            $scope.lng = lng;
            $scope.address = address;
        });
    }, function(err) {
        $scope.address = "unknown";
    });
    */
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
});
