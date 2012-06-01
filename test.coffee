cass = require('cassandra-client')
UUID = cass.UUID
argv = require('optimist').argv
system = new cass.System('localhost:9160')

if argv.show
    system.describeKeyspace('cord', (err, def) ->
        if err
            console.log(err)
        else
            console.log(def)
    )

if argv.schema
    ks = new cass.KsDef(
        name: 'cord'
        strategy_class: 'org.apache.cassandra.locator.SimpleStrategy'
        strategy_options: { replication_factor: '1' }
        cf_defs: [
            new cass.CfDef(
                keyspace: 'cord'
                name: 'logs'
                column_type: 'Standard'
                comparator_type: 'UTF8Type'
                comment: 'Log aggregation/search'
                key_validation_class: 'UTF8Type'
                default_validation_class: 'UTF8Type'
                column_metadata: [
                    new cass.ColumnDef({name: 'message', validation_class: 'UTF8Type' })
                    new cass.ColumnDef({name: 'type', validation_class: 'UTF8Type' })
                    new cass.ColumnDef({name: 'originalMessage', validation_class: 'UTF8Type' })
                    new cass.ColumnDef({name: 'facility', validation_class: 'UTF8Type' })
                    new cass.ColumnDef({name: 'severity', validation_class: 'UTF8Type' })
                    new cass.ColumnDef({name: 'host', validation_class: 'UTF8Type' })
                    new cass.ColumnDef({name: 'prival', validation_class: 'Int32Type' })
                    new cass.ColumnDef({name: 'facilityID', validation_class: 'Int32Type' })
                    new cass.ColumnDef({name: 'severityID', validation_class: 'Int32Type' })
                ]
                compression_options:
                    sstable_compression: 'SnappyCompressor'
            )
        ]
    )

    system.addKeyspace(ks, (err) ->
        if err
            console.log(err)
        else
            console.log('Created')
    )


###
conn = new cass.Connection(
    host: 'localhost'
    port: 9160
    keyspace: 'cord'
)
###

conn = new cass.PooledConnection(
    hosts: [ '127.0.0.1:9160' ]
    keyspace: 'cord'
)

if argv.drop
    console.log 'Dropping'
    conn.execute('DROP KEYSPACE ?', ['cord'], (err,res) ->
        if err
            console.log(err)
        else
            console.log('Dropped: '+res)
    )

if argv.w
    conn.execute("update logs using consistency any and ttl 60 set ?=? where KEY=?;", ['message','foobar',UUID.fromTime(1234)], (err,rs) ->
        if err
            console.log(err)
        else
            console.log(rs)
    )

if argv.r
    conn.execute("select * from logs;", [], (err,rs) ->
        if err
            console.log(err)
        else
            console.log((r.colHash) for r in rs)
    )
