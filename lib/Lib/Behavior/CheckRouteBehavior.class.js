/**
 * 检测路由行为
 * 通过自定义路由识别到对应的URL上
 * @return {[type]} [description]
 */
var url = require("url");
var Dispatcher = think_require("Dispatcher");

module.exports = Behavior(function(){
    return {
        options: {
            'url_route_on': false, //是否开启自定义URL路由
            'url_route_rules': {} //自定义URL路由规则
        },
        run: function(){
            var pathname = this.http.pathname;
            if (!pathname) {
                return false;
            };
            if (!this.options.url_route_on) {
                return false;
            };
            var routes = this.options.url_route_rules;
            if (Object.keys(routes).length == 0) {
                return false;
            };
            for(var rule in routes){
                var route = routes[rule];
                var reg = this.strToReg(rule);
                var match = null;
                if (reg) {
                    match = pathname.match(reg);
                };
                if ( reg && match) {
                    var result =  this.parseRegExp(match, route, pathname);
                    if (result) {
                        return result;
                    };
                }
                var match = this.checkUrlMatch(pathname, rule);
                if (match) {
                    return this.parseRule(rule, route, pathname);
                };
            }
        },
        parseRule: function(rule, route, pathname){
            route = this.getRoute(route);
            if (!route) {
                return false;
            };
            pathname = pathname.split("/");
            rule = rule.split("/");
            var matches = {};
            rule.forEach(function(item){
                if (item.indexOf(":") === 0) {
                    item = item.substr(1);
                    matches[item] = pathname.shift();
                }else{
                    pathname.shift();
                }
            });
            //将剩余的pathname分割为querystring
            if (pathname.length) {
                for(var i = 0,length = Math.ceil(pathname.length)/2; i < length; i++){
                    this.http.query[pathname[i * 2]] = pathname[i * 2 + 1] || "";
                }
            };
            var values = [''];
            for(var name in matches){
                values.push(matches[name]);
            }
            route = route.replace(/:(\d+)/g, function(a, b){
                return values[b] || "";
            });
            this.parseUrl(route);
            return true;
        },
        checkUrlMatch: function(pathname, rule){
            pathname = pathname.split("/");
            rule = rule.split("/");
            return rule.every(function(item, i){
                if (item.indexOf(':') === 0) {
                    if (item.indexOf('\\')) {
                        var type = item.substr(-1);
                        if (type == 'd' && !is_number(pathname[i])) {
                            return false;
                        };
                    };
                }else{
                    var pitem = pathname[i] || "";
                    if (pitem.toLowerCase() != item.toLowerCase()) {
                        return false;
                    };
                }
                return true;
            });
        },
        parseUrl: function(urlInfo){
            urlInfo = url.parse(urlInfo, true);
            if (urlInfo.query) {
                this.http.query = extend(this.http.query, urlInfo.query);
            };
            var pathname = urlInfo.pathname || "";
            // 过滤调用pathname最后有/的情况
            pathname = pathname.split("/").filter(function(item){
                item = item.trim();
                if (item) {
                    return item;
                };
            })
            this.http.action = Dispatcher.getAction(pathname.pop());
            this.http.controller = Dispatcher.getController(pathname.pop());
            this.http.group = Dispatcher.getGroup(pathname.pop());
        },
        getRoute: function(route){
            if (typeof route == 'function') {
                route = route();
            }else if (is_object(route)) {
                var sRoute = '';
                //对应的请求类型
                for(var method in route){
                    var nmethod = method.split(",").filter(function(item){
                        item = item.trim();
                        return item;
                    });
                    if (nmethod.indexOf(this.http.method) != -1) {
                        sRoute = route[method];
                        break;
                    };
                }
                if (!sRoute) {
                    return false;
                };
                route = sRoute;
            };
            return route;
        },
        /**
         * 正则匹配路由
         * @param  {[type]} matches  [description]
         * @param  {[type]} route    [description]
         * @param  {[type]} pathname [description]
         * @return {[type]}          [description]
         */
        parseRegExp: function(matches, route, pathname){
            route = this.getRoute(route);
            if (!route) {
                return false;
            };
            route = route.replace(/:(\d+)/g, function(a, b){
                return matches[b] || "";
            });
            pathname = pathname.replace(matches[0], "");
            pathname = pathname.split("/").filter(function(item){
                return item;
            });
            //将剩余的pathname分割为querystring
            if (pathname.length) {
                for(var i = 0,length = Math.ceil(pathname.length)/2; i < length; i++){
                    this.http.query[pathname[i * 2]] = pathname[i * 2 + 1] || "";
                }
            };
            this.parseUrl(route);
            return true;
        },
        /**
         * 判断是否是一个正则路由，如果是则将字符串转成对应的正则返回
         * @param  {[type]} str [description]
         * @return {[type]}     [description]
         */
        strToReg: function(str){
            if (str.indexOf('/') !== 0) {
                return false;
            };
            var pos = str.lastIndexOf('/');
            var modifier = str.substr(pos + 1);
            if (modifier) {
                if (!(/^[igm]+$/.test(modifier))) {
                    return false;
                };
            };
            str = str.substr(1, pos - 1);
            str = str.replace(/\\/g, "\\\\");
            var reg = new RegExp(str, modifier);
            return reg;
        }
    }
});