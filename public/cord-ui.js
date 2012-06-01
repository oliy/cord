Ext.Loader.setConfig({enabled: true});

Ext.Loader.setPath('Ext.ux', '../ux/');
Ext.require([
    'Ext.container.*',
    'Ext.layout.container.*',
    'Ext.grid.*',
    'Ext.chart.*',
    'Ext.data.*',
    'Ext.util.*',
    'Ext.grid.PagingScroller',
    'Ext.ux.form.SearchField',
]);

Ext.application({
    name: 'Cord',

    launch: function() {
    
        Ext.define('Cord.PairJson', {
            extend: 'Ext.data.reader.Json',
            alias: 'reader.jsonpair',
            readRecords: function(data) {
                var orig = data.facet_counts.facet_dates.time;
                var res = [];
                for (var k in orig)
                    res.push({ x: k, y: orig[k]});
                return this.callParent([res]);
            }
        });
        
        var words = Ext.create('Ext.data.Store', {
            fields: [ 'key', 'value' ],
            proxy: {
                type: 'memory',
                reader: { type: 'array'},
            }
        });
        
        Ext.define('Cord.SolrReader', {
            extend: 'Cord.PairJson',
            alias: 'reader.solr',
            
            tmpl: new Ext.XTemplate(
                'Message<ul>',
                '<tpl for="message">',
                '  <li>- <a href="#" onClick="Cord.search(\'{0}\')">{0} ({1})</a></li>',
                '</tpl></ul>',
                'Severity<ul>',
                '<tpl for="severity">',
                '  <li>- <a href="#" onClick="Cord.search(\'severity:{0}\')">{0} ({1})</a></li>',
                '</tpl></ul>',
                'Facility<ul>',
                '<tpl for="facility">',
                '  <li>- {0} ({1})</li>',
                '</tpl></ul>',
                'Host<ul>',
                '<tpl for="host">',
                '  <li>- <a href="#" onClick="Cord.search(\'host:{0}\')">{0} ({1})</a></li>',
                '</tpl></ul>'
            ),
            
            readRecords: function(data) {
                var facets = data.facet_counts.facet_fields;
                var message = [], severity = [], facility= [], host = [];

                var facet = facets.message;
                for (var i=0; i<facet.length; i+=2)
                    message.push([facet[i],facet[i+1]]);
                    
                var facet = facets.severity;
                for (var i=0; i<facet.length; i+=2)
                    severity.push([facet[i],facet[i+1]]);
                    
                var facet = facets.facility;
                for (var i=0; i<facet.length; i+=2)
                    facility.push([facet[i],facet[i+1]]);
                    
                var facet = facets.host;
                for (var i=0; i<facet.length; i+=2)
                    host.push([facet[i],facet[i+1]]);
                    
                words.loadRawData(message);
                
                var nav = Cord.view.query('#nav')[0];
                console.log(nav);
                this.tmpl.overwrite(nav.body, { message:message, severity:severity, facility:facility, host:host });
                console.log('facets')
                console.log(facets);
                return this.callParent(arguments);
            }
        });
        
        Cord.summary = Ext.create('Ext.data.Store', {
            storeId: 'summary',
            autoLoad: true,
            remoteFilter: true,
            fields: [ 'x', 'y' ],
            proxy: {
                type: 'jsonp',
                url: 'http://localhost:8983/solr/cord.logs/select/',
                filterParam: 'q',
                extraParams: {
                    start: 0,
                    rows: 0,
                    //indent: 'on',
                    wt: 'json',
                    facet: 'true',
                    sort: 'time desc',
                    'facet.date': 'time',
                    'facet.date.start': 'NOW-30MINUTES',
                    'facet.date.end': 'NOW',
                    'facet.date.gap': '+1MINUTE',
                    'facet.field': [ 'message','severity','facility','host' ],
                    'facet.limit': 10,
                },
                callbackKey: 'json.wrf',
                reader: {
                    type: 'solr',
                },
                encodeFilters:  function(filters) {
                    return filters[0].value;
                } ,           
            },
        /*
            data: [
                { x:1, y:5 },
                { x:2, y:2 },
                { x:3, y:8 },
                { x:4, y:6 },
                { x:5, y:3 },
                { x:6, y:9 },
            ]
        */
        });
        
        Cord.logs = Ext.create('Ext.data.Store', {
            storeId: 'logs',
            autoLoad: true,
            remoteFilter: true,
            buffered: true,
            pageSize: 100,
            fields: [ 
                'type',
                'prival',
                'facility',
                'severity',
                'time',
                'host',
                'message',
            ],
            proxy: {
                type: 'jsonp',
                url: 'http://localhost:8983/solr/cord.logs/select/',
                startParam: 'start',
                limitParam: 'rows',
                filterParam: 'q',
                extraParams: {
                    //q: 'severityID:[5 TO *]',
                    version: '2.2',
                    sort: 'time desc',
                    //indent: 'on',
                    wt: 'json',
                },
                callbackKey: 'json.wrf',
                reader: {
                    type: 'json',
                    root: 'response.docs',
                    totalProperty: 'response.numFound',
                }
            },
        /*
            data: [
                { type: 'RFC512', prival:5, facility: 'log', severity: 'warn', time:'1', host:'localhost', message: 'Some message' },
                { type: 'RFC512', prival:5, facility: 'log', severity: 'err', time:'1', host:'localhost', message: 'Some error' },
                { type: 'RFC512', prival:5, facility: 'log', severity: 'warn', time:'1', host:'localhost', message: 'Some message 1' },
                { type: 'RFC512', prival:5, facility: 'log', severity: 'warn', time:'1', host:'localhost', message: 'Some message 2' },
                { type: 'RFC512', prival:5, facility: 'log', severity: 'warn', time:'1', host:'localhost', message: 'Some message 3' },
                { type: 'RFC512', prival:5, facility: 'log', severity: 'warn', time:'1', host:'localhost', message: 'Some message 4' },
            ]
        */
        });
        Ext.Function.interceptAfter(Cord.logs, 'filter', function() {
            console.log('summary refilter');
            Cord.summary.clearFilter(true);
            var filters = Cord.logs.filters.items;
            console.log(filters);
            Cord.summary.filter(filters[0].property, filters[0].value);
            Cord.summary.load();
        });
        Cord.reload = function() {
            console.log('reload');
            Cord.summary.load();
            //Cord.logs.load();
        }
        setTimeout('Cord.reload()', 1000);
        //setInterval('Cord.reload()', 1000);
        
        Cord.view = Ext.create('Ext.container.Viewport', {
            layout: 'border',
            items: [{
                region: 'north',
                items: [{
                    layout: 'fit',
                    xtype: 'form',
                    items: [{
                        itemId: 'search',
                        xtype: 'searchfield',
                        store: Cord.logs,
                        value: '*:*',
                    }]
                }]
            },{
                region: 'west',
                id: 'nav',
                collapsible: true,
                width: 200,
            },{
                region: 'center',
                layout: 'border',
                items: [{
                    //html: 'Graph'
                    xtype: 'chart',
                    animate: true,
                    height: 200,
                    region: 'north',
                    store: 'summary',
                    axes: [{
                        type: 'Numeric',
                        position: 'bottom',
                        title: 'date/time',
                        fields: ['x'],
                    },{
                        type: 'Numeric',
                        position: 'left',
                        title: 'hits',
                        minimum: 0,
                        fields: ['y'],
                    }],
                    series: [{
                        type: 'column',
                        axis: 'left',
                        xField: 'x',
                        yField: 'y',
                    }]
                },{
                    xtype: 'grid',
                    store: 'logs',
                    region: 'center',
                    viewConfig: {
                        trackOver: false,
                        singleSelect: true,
                    },
                    //verticalScrollerType: 'paginggridscroller',
                    invalidateScrollerOnRefresh: false,
                    columns: [{
                        text: 'Date',
                        dataIndex: 'time',
                        width:150,
                    },{
                        text: 'Host',
                        dataIndex: 'host',
                        width:50,
                    },{
                        text: 'Facility',
                        dataIndex: 'facility',
                        width:50,
                    },{
                        text: 'Severity',
                        dataIndex: 'severity',
                        width:50,
                    },{
                        text: 'Message',
                        dataIndex: 'message',
                        flex: 1,
                    }],
                }]
            },{
                region: 'south',
                height: 100,
                collapsible: true,
                html: 'Messages',
            }]
        });
        
        Cord.search = function(word) {
            var search = Cord.view.down("#search");
            search.setValue(word);
            search.onTrigger2Click();
        };

        Cord.search('*:*');
    }
})