angular.module('starter.directives',[]).directive('request',['$rootScope','SOCKET_URL',function($rootScope,SOCKET_URL){
    return{
        replace:true,
        restrict:'AE',
        link:function($rootScope,elem,attrs){
            socket = io.connect(SOCKET_URL);
            socket.on('request',function(data){
                $rootScope.$apply(function(){
                    data.date = Date();
                    $rootScope.messages.unshift(data);
                });
            });
        },
        templateUrl:'templates/request.html'
    }
}]);
