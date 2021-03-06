//本文件功能为原生对象的方法扩展

/**
 * 获取对象的值
 * 原生的有Object.keys, 但不知道为啥不添加个Object.values方法
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
Object.values = function(obj){
    return Object.keys(obj).map(function(item){
        return obj[item];
    })
}
/**
 * 数组求和
 * @return {[type]} [description]
 */
Array.prototype.sum = function(){
	var count = 0;
	this.forEach(function(item){
		count += item;
	})
	return count;
}