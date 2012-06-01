#!/bin/sh


SOLRCONFIG_URL=http://localhost:8983/solr/resource/cord.logs/solrconfig.xml
SOLRCONFIG=solrconfig.xml

curl $SOLRCONFIG_URL --data-binary @$SOLRCONFIG -H 'Content-type:text/xml; charset=utf-8' 
echo "Posted $SOLRCONFIG to $SOLRCONFIG_URL"

SCHEMA_URL=http://localhost:8983/solr/resource/cord.logs/schema.xml
SCHEMA=schema.xml

curl $SCHEMA_URL --data-binary @$SCHEMA -H 'Content-type:text/xml; charset=utf-8' 
echo "Posted $SCHEMA to $SCHEMA_URL"

