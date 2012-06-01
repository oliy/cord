exports.apply = apply = (o, c) ->
    o = o || {}
    (o[k]=v) for k,v of c
    o

exports.applyIf = applyIf = (o, c) ->
    o = o || {}
    (o[k]=v) for k,v of c when !o[k]
    o

exports.cloneIf = cloneIf = (o, t) ->
    if t==false
        o
    else if typeof t=='function'
        t(null, o)
    else if o==null or o==undefined
        null
    else if typeof o!='object'
        o
    else if t==true
        apply(null, o)
    else
        c = {}
        for k,v of t
            c[k] = cloneIf(o[k], v)
        c

exports.copyIf = copyIf = (o, c, t) ->
    if t==false
        c
    else if typeof t=='function'
        t(null, c)
    else if o==null or o==undefined
        null
    else if typeof o!='object'
        c
    else if t==true
        apply(null, c)
    else
        o = o || {}
        for k,v of t
            o[k] = cloneIf(c[k], v)
        o

exports.trim = trim = (s) ->
	s.replace(/^\s\s*/, '').replace(/\s\s*$/, '')

exports.install = (namespace) ->
	if namespace and !namespace.apply
		apply(namespace, exports)