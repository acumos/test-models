#!/bin/bash
# submit data to an Acumos model

if [ $# -lt 1 ]; then
    echo "Usage: $0 data-file.txt"
    echo "   The file must contain data in protoc tag-value format"
    exit 1
fi

if [ ! -f $1 ]; then 
    echo "$0: not found or not a file: $1"
    exit 1
fi

host=localhost
port=8336
protofile="loopback.proto"
package="simplepackage"
firstmsg="SimpleMessage"
firstop="loopback"
lastmsg="SimpleMessage"
url="http://$host:$port/modelrunner/$firstop"

echo "$0 config: host=${host}, port=${port}"
echo "$0 config: protocol buffer definition file=${protofile}, package=${package}"
echo "$0 config: input message=${firstmsg}, output message=${lastmsg}, endpoint=${firstop}"
echo "$0 config: POST data URL=${url}"
echo "$0 input: file=$1"
cat $1  \
 | protoc --encode=${package}.${firstmsg} ${protofile} \
 | curl -v -s --request POST --header "Content-Type: application/protobuf" --data-binary @- $url \
 | protoc --decode=${package}.${lastmsg} ${protofile}
