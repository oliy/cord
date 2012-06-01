syslogParse = require('glossy').Parse.parse
cass = require('cassandra-client')
UUID = cass.UUID
dgram = require('dgram')

argv = require('optimist').argv
log = console.log

conn = new cass.PooledConnection(
    hosts: [ '127.0.0.1:9160' ]
    keyspace: 'cord'
)

meta = 
    originalMessage: 'text'
    type: 'text'
    prival: 'varint'
    facilityID: 'varint'
    severityID: 'varint'
    facility: 'text'
    severity: 'text'
    time: 'timestamp'
    host: 'text'
    message: 'text'

fields = (field for field,_ of meta)
fields.sort()

ttl = 30 * 24 * 3600   # TTL in seconds
updateStmt = 'update logs using consistency any and ttl '+ttl+' set ' + ("'#{f}'=?" for f in fields).join(',') + " where KEY=?;"
log updateStmt

server = dgram.createSocket('udp4')

server.on 'listening', ->
    address = server.address()
    console.log('Syslogd started on '+address.address+':'+address.port)

    ###
    conn.execute("
        CREATE KEYSPACE log;
        CREATE TABLE log (
            KEY uuid PRIMARY KEY,
            " + ( (field + " " + meta[field]) for field in fields).join(",") + "
        ) WITH comment='Log';
    ", (err) ->
        console.log(err)
    )
    ###
    
    server.on 'message', (msg) ->
        syslogParse(msg.toString('utf8', 0), (msg) ->
            msg.time = new Date().toISOString()
            vals = (msg[field] ? '' for field in fields)
            vals.push(UUID.fromTime(Date.now()))
            console.log(vals)
            conn.execute(updateStmt, vals, (err,row) ->
                if err
                    console.log(err)
                else
                    console.log(row)
            )
        )

server.bind(514)
