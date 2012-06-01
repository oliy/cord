exports.naturalOrder = naturalOrder = function(a,b) { return a==b? 0 : a<b? -1 : 1; }
exports.identity = identity = function(o) { return o; }

exports.bsearch = bsearch = function(arr, o, miss, comp) {
    if (!comp) comp = naturalOrder;
    var lo=0, hi=arr.length;
    while (lo<hi) {
        var mid = (lo+hi)>>1,
            c = comp(o,arr[mid]);
        if (c==0) return mid;
        else if (c<0) hi=mid;
        else lo=mid+1;
    }
    return miss? lo : -1;
}

exports.orderedArray = orderedArray = function(arr, compare) {
    if (!arr) arr = [];
    if (!compare) compare = naturalOrder;
    arr.compare = compare;
    arr.search = function(o) { return bsearch(arr, o, false, compare); }
    arr.add = function(o) {
		if (arguments.length>1) {
			for (var i=0; i<arguments.length; i++)
				arr.add(arguments[i]);
			return;
		}
        var i = bsearch(arr, o, true, compare);
        if (i<arr.length && compare(o, arr[i])==0) return -1;
        arr.splice(i,0,o);
        return i;
    }
    arr.remove = function(o) {
        var i = this.search(o);
        return (i>=0)? arr.splice(i,1)[0] : null;
    }
	arr.resort = function() {
		arr.sort(compare);
	}
    arr.resort();
    return arr;
}

exports.topArray = topArray = function(arr, compare, maximum) {
	arr = orderedArray(arr,compare);
	arr.maximum = maximum;
	var oldAdd = arr.add;
	arr.add = function(o) {
		if (arguments.length>1) {
			for (var i=0; i<arguments.length; i++)
				arr.add(arguments[i]);
			return;
		}
		if (this.length>=this.maximum) {
			if (compare(o, this[this.length-1])>0)
				// not better than the last item, so drop
				return;
			// else make space
			this.pop();
		}
		oldAdd(o);
	}
	return arr;
}

exports.indexedArray = indexedArray = function(arr, indexer, compare) {
    if (!arr) arr = [];
    if (!indexer) indexer = identity;
    if (!compare) compare = naturalOrder;
    var itemComp = function(a,b) { return compare(indexer(a), indexer(b)); };
    var keyComp = arr.keyComp = function(a,b) { return compare(a, indexer(b)); };
    arr = orderedArray(arr, itemComp);
    arr.indexer = indexer;
    arr.searchKey = function(key) { return bsearch(arr, key, false, keyComp); }
    arr.get = function(key) { return this[this.searchKey(key)]; }
    arr.removeKey = function(key) {
        var i = this.searchKey(key);
        return (i>=0)? arr.splice(i,1)[0] : null;
    }
    return arr;
}
