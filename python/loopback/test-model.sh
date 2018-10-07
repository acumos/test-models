#!/bin/bash
# ===============LICENSE_START=======================================================
# Acumos Apache-2.0
# ===================================================================================
# Copyright (C) 2018 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
# ===================================================================================
# This Acumos software file is distributed by AT&T and Tech Mahindra
# under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# This file is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ===============LICENSE_END=========================================================

# Encodes data from a text file using protoc,
# posts binary result to an Acumos model,
# and decodes the result from binary to text.
# Configured for model runner behavior in Athena release

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
port=3330
protofile="loopback.proto"
package="simplepackage"
firstmsg="SimpleMessage"
firstop="loopback"
lastmsg="SimpleMessage"
# context path is chosen by model runner microservice
url="http://$host:$port/$firstop"

echo "$0 config: host=${host}, port=${port}"
echo "$0 config: protocol buffer definition file=${protofile}, package=${package}"
echo "$0 config: input message=${firstmsg}, output message=${lastmsg}, endpoint=${firstop}"
echo "$0 config: POST data URL=${url}"
echo "$0 input: file=$1"
cat $1  \
 | protoc --encode=${package}.${firstmsg} ${protofile} \
 | curl -v -s --request POST --header "Content-Type: application/protobuf" --data-binary @- $url \
 | protoc --decode=${package}.${lastmsg} ${protofile}
