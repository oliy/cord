exports.cb_args = cb_args = (args, n) ->
    l = args.length
    if l<n
        args[n-1] = args[l-1]
        delete args[l-1]
    args
    
