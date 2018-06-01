#!/bin/bash
# ===============LICENSE_START=======================================================
# Acumos Apache-2.0
# ===================================================================================
# Copyright (C) 2018 AT&T Intellectual Property. All rights reserved.
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
#
# What this is: script to automate model onboarding.
#
# Prerequisites:
# - User has account on Acumos platform
# - Model dumped by the Acumos client library, i.e. the following files
#   - metadata.json
#   - model.proto
#   - model.zio
#
# Usage:
# $ bash onboard-model.sh <host> <username> <password> <model> <insecure>
#   host: host of the model onboarding service
#   username: username to onboard models for
#   password: password for user
#   model: folder with model to onboard
#   insecure: optional flag allowing onboarding to insecure server (installed
#      with self-signed server cert, as needed for test platforms)

trap 'fail' ERR

function fail() {
  log "$1"
  cd $WORK_DIR
  exit 1
}

function log() {
  f=$(caller 0 | awk '{print $2}')
  l=$(caller 0 | awk '{print $1}')
  echo; echo "$f:$l ($(date)) $1"
}

function onboard() {
  trap 'fail' ERR
  AUTHURL=https://$host/onboarding-app/v2/auth
  PUSHURL=https://$host/onboarding-app/v2/models

  log "Query rest service to get token"
  resp=$(curl -k -X POST -H 'Content-Type: application/json' -H 'Accept: application/json' $AUTHURL -d "{\"request_body\":{\"username\":\"$user\",\"password\":\"$pass\"}}")
  jwtToken=$(echo "$resp" | jq -r '.jwtToken')

  # Use this jwtToken for all the bootstrap onboarding
  if [ "$jwtToken" != "null" ]
  then
    log "Authentication successful"
    echo "Onboarding model $model ..."
    if [[ "$insecure" == "insecure" ]]; then k="-k"; fi
    curl -o ~/json $k -H "Authorization: $jwtToken"\
         -F "model=@$model/model.zip;type=application/zip" \
         -F "metadata=@$model/metadata.json;type=application/json"\
         -F "schema=@$model/model.proto;type=application/text" $PUSHURL
    if [[ $(grep -c "The upstream server is timing out" ~/json) -eq 1 ]]; then 
      log "Onboarding $model failed: $(cat ~/json)"
    else
      status=$(jq -r '.status' ~/json)
      if [[ "$status" != "ERROR" ]]; then
        log "Onboarding $model succeeded"
      else
        log "Onboarding $model failed: $(cat ~/json)"
      fi
    fi
  else
      log 'Authentication failed, response = ' $resp
      log 'Cannot continue, exiting'
  fi
}

host=$1
user=$2
pass=$3
model="$4"
insecure=$5
onboard
