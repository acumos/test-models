#!/bin/bash
# ===============LICENSE_START=======================================================
# Acumos Apache-2.0
# ===================================================================================
# Copyright (C) 2017-2018 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
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
#. What this is: Script to dump all artifacts and metadata for Acumos models
#.               ("solutions") into an archive. Can be used for a single
#.               solution/version or all solutions/versions.
#. Prerequisites:
#. - Acumos platform deployed, with access enabled for the user to the CDS,
#.   Nexus, and Portal service. Typically this requires the user to be
#.   logged into a shell session on the machine hosting the Acumos platform,
#.   but will also work when the services above are accessible over a network.
#.
#. Usage:
#. $ bash dump-models.sh <cdsUri> <cdsCreds> <cdsVer> <nexusUri> <nexusRepo>
#.                       <portalUrl> <active> <latest|all> [solutionId] [version]
#.   cdsUri: base URI (scheme://host:port) of the CDS service
#.   cdsCreds: usernane:password for accessing the CDS service
#.   cdsVer: version of the CDS service (1.14 | 1.16)
#.   nexusUri: base URI (scheme://host:port) of the Nexus service
#.   nexusRepo: name of maven model repo in the nexus service
#.   portalUri: base URI (scheme://host:port) of the Acumos portal
#.   active: filter to apply for active solutions only (true|false)
#.   latest|all: get only the latest revision, or all
#.   OPTIONAL: to get a specific model
#.   solutionId: ID of Acumos solution
#.  version: version of Acumos solution (e.g. 1)
#.
#.  Places the dumped model(s) into archives and subfolders of /tmp/acumos

trap 'fail' ERR

function fail() {
  log "$1"
  exit 1
}

function log() {
  f=$(caller 0 | awk '{print $2}')
  l=$(caller 0 | awk '{print $1}')
  echo; echo "$f:$l ($(date)) $1"
}

function find_version() {
  echo curl -s -o /tmp/acumos/solutions/${solutionId}.json -u $cdsCreds $cdsUri/ccds/solution/$solutionId
  curl -s -o /tmp/acumos/solutions/${solutionId}.json -u $cdsCreds $cdsUri/ccds/solution/$solutionId
  log "Solution data:"
  cat /tmp/acumos/solutions/${solutionId}.json
  name=$(jq -r '.name' /tmp/acumos/solutions/${solutionId}.json)
  mkdir -p /tmp/acumos/solutions/${solutionId}
  echo curl -s -o /tmp/acumos/solutions/${solutionId}/revisions.json -u $cdsCreds $cdsUri/ccds/solution/$solutionId/revision
  curl -s -o /tmp/acumos/solutions/${solutionId}/revisions.json -u $cdsCreds $cdsUri/ccds/solution/$solutionId/revision
  revs=$(jq -r '. | length' /tmp/acumos/solutions/${solutionId}/revisions.json)
  i=0; revisionId=""
  while [[ $i -lt $revs && "$revisionId" == "" ]] ; do
    v=$(jq -r ".[$i].version" /tmp/acumos/solutions/${solutionId}/revisions.json)
    if [[ "$v" == "$version" ]]; then
      revisionId=$(jq -r ".[$i].revisionId" /tmp/acumos/solutions/${solutionId}/revisions.json)
    fi
    ((i++))
  done

  if [[ "$revisionId" == "" ]]; then 
    log "${solutionId} version ${version} not found"
  else
    log "Solution revisions:"
    cat /tmp/acumos/solutions/${solutionId}/revisions.json
    log "Solution verion $version has revisionId $revisionId"
  fi
}

function dump() {
  if [[ $(ls /tmp/acumos/*${solutionId}_${version}.zip) != "" ]]; then
    log "$(ls /tmp/acumos/*${solutionId}_${version}.zip) exists - not overwriting"
    return
  fi

  log "Downloading ${name}_${solutionId}_${version}"
  mkdir -p /tmp/acumos/${name}_${solutionId}_${version}/artifacts
  mkdir -p /tmp/acumos/${name}_${solutionId}_${version}/metadata
  mkdir -p /tmp/acumos/solutions/${solutionId}/${revisionId}

  log "Getting artifacts"
  if [[ "$cdsVer" == "1.14" ]]; then
    echo; echo curl -s -o /tmp/acumos/solutions/${solutionId}/${revisionId}/artifacts.json -u $cdsCreds $cdsUri/ccds/solution/$solutionId/revision/$revisionId/artifact
    curl -s -o /tmp/acumos/solutions/${solutionId}/${revisionId}/artifacts.json -u $cdsCreds $cdsUri/ccds/solution/$solutionId/revision/$revisionId/artifact
  else
    echo; echo curl -s -o /tmp/acumos/solutions/${solutionId}/${revisionId}/artifacts.json -u $cdsCreds $cdsUri/ccds/revision/$revisionId/artifact
    curl -s -o /tmp/acumos/solutions/${solutionId}/${revisionId}/artifacts.json -u $cdsCreds $cdsUri/ccds/revision/$revisionId/artifact
  fi
  log "Solution revision artifacts data:"
  cat /tmp/acumos/solutions/${solutionId}/${revisionId}/artifacts.json
  arts=$(jq -r '. | length' /tmp/acumos/solutions/${solutionId}/${revisionId}/artifacts.json)
  i=0
  while [[ $i -lt $arts ]] ; do
    art=$(jq -r ".[$i].name" /tmp/acumos/solutions/${solutionId}/${revisionId}/artifacts.json)
    uri=$(jq -r ".[$i].uri" /tmp/acumos/solutions/${solutionId}/${revisionId}/artifacts.json)
    # Skip the 'name' artifact (microservice image) - we will get it from docker
    if [[ "$art" != "$name" ]]; then
      log "Downloading artifact $art to /tmp/acumos/${name}_${solutionId}_${version}/artifacts/$art"  
      echo; echo wget -O /tmp/acumos/${name}_${solutionId}_${version}/artifacts/$art $nexusUri/repository/$nexusRepo/$uri
      wget -O /tmp/acumos/${name}_${solutionId}_${version}/artifacts/$art $nexusUri/repository/$nexusRepo/$uri
    fi
    ((i++))
  done

  log "Getting metadata"
  log "Getting $solutionId/$revisionId description"
  if [[ $(echo $portalUri | grep -c https) -gt 0 ]]; then k="-k"; fi
  echo; echo curl -s $k -o ~/json $portalUri/site/api-manual/Solution/description/public/$solutionId/$revisionId
  curl -s $k -o ~/json $portalUri/site/api-manual/Solution/description/public/$solutionId/$revisionId
  log "Solution revision description:"
  cat ~/json
  jq -r ".description" ~/json >/tmp/acumos/${name}_${solutionId}_${version}/metadata/description.txt
  log "Getting list of $solutionId/$revisionId solutionAssets"
  echo; echo curl -s $k -o ~/json $portalUri/site/api-manual/Solution/solutionAssets/$solutionId/$revisionId/?path=public
  curl -s $k -o ~/json $portalUri/site/api-manual/Solution/solutionAssets/$solutionId/$revisionId/?path=public
  log "Solution asset data:"
  cat ~/json
  mets=$(jq -r '.response_body | length' ~/json)
  i=0;
  while [[ $i -lt $mets ]] ; do
    met=$(jq -r ".response_body[$i]" ~/json)
    log "Solution asset $met data:"
    cat ~/json
    log "Downloading solutionAsset $met to ~/tmp/acumos/${name}_${solutionId}_${version}/metadata/$met"
    echo wget --no-check-certificate -O /tmp/acumos/${name}_${solutionId}_${version}/metadata/$met $portalUri/site/binaries/content/assets/solutiondocs/solution/$solutionId/$revisionId/public/$met
    wget --no-check-certificate \
      -O /tmp/acumos/${name}_${solutionId}_${version}/metadata/$met \
      $portalUri/site/binaries/content/assets/solutiondocs/solution/$solutionId/$revisionId/public/$met
    ((i++))
  done

  cd /tmp/acumos
  if [[ -f ${name}_${solutionId}_${version}.zip ]]; then rm ${name}_${solutionId}_${version}.zip; fi
  zip -r ${name}_${solutionId}_${version}.zip ./${name}_${solutionId}_${version}
  log "Downloaded artifacts in /tmp/acumos/${name}_${solutionId}_${version}/artifacts"
  ls -lat /tmp/acumos/${name}_${solutionId}_${version}/artifacts
  log "Downloaded metadata in /tmp/acumos/${name}_${solutionId}_${version}/metadata"
  ls -lat /tmp/acumos/${name}_${solutionId}_${version}/metadata
}

if [[ "$#" -lt 8 ]]; then
  echo "All required parameters not provided"
  if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then grep '#\.' $0; fi
else
  export WORK_DIR=$(pwd)
  cdsUri=$1
  cdsCreds=$2
  cdsVer=$3
  nexusUri=$4
  nexusRepo=$5
  portalUri=$6
  active=$7
  what=$8
  solutionId=$9
  version=$10

  mkdir -p /tmp/acumos/solutions

  if [[ $(dpkg -l | grep -c ' jq ') -eq 0 ]]; then
    log "Install jq"
    sudo apt-get install -y jq zip
  fi

  if [[ "$solutionId" == "" ]]; then
    curl -s -o /tmp/acumos/solutions.json -u $cdsCreds $cdsUri/ccds/solution?size=10000
    sols=$(jq -r '.content | length' /tmp/acumos/solutions.json)
    sol=0
    while [[ $sol -lt $sols ]] ; do
      solutionId=$(jq -r ".content[$sol].solutionId" /tmp/acumos/solutions.json)
      if [[ $(find /tmp/acumos/. -name *${solutionId}_*.zip) != "" ]]; then
        log "solutionId $solutionId zip exists - skipping"
      else
        echo; echo curl -s -o /tmp/acumos/solutions/${solutionId}.json -u $cdsCreds $cdsUri/ccds/solution/$solutionId
        curl -s -o /tmp/acumos/solutions/${solutionId}.json -u $cdsCreds $cdsUri/ccds/solution/$solutionId
        cat /tmp/acumos/solutions/${solutionId}.json
        if [[ "$(jq -r '.active' /tmp/acumos/solutions/${solutionId}.json)" == "$active" ]]; then
          mkdir -p /tmp/acumos/solutions/${solutionId}
          echo; echo curl -s -o /tmp/acumos/solutions/${solutionId}/revisions.json -u $cdsCreds $cdsUri/ccds/solution/${solutionId}/revision
          curl -s -o /tmp/acumos/solutions/${solutionId}/revisions.json -u $cdsCreds $cdsUri/ccds/solution/${solutionId}/revision
          cat /tmp/acumos/solutions/${solutionId}/revisions.json
          rs=$(jq -r '. | length' /tmp/acumos/solutions/${solutionId}/revisions.json)
          if [[ $rs -gt 0 ]]; then
            if [[ "$what" == "latest" ]]; then
              ((rs--))
              version=$(jq -r ".[$rs].version" /tmp/acumos/solutions/${solutionId}/revisions.json)
              revisionId=$(jq -r ".[$rs].revisionId" /tmp/acumos/solutions/${solutionId}/revisions.json)
              dump
            else
              r=0
              while [[ $r -lt $rs ]] ; do
                version=$(jq -r ".[$r].version" /tmp/acumos/solutions/${solutionId}/revisions.json)
                revisionId=$(jq -r ".[$i].revisionId" /tmp/acumos/solutions/${solutionId}/revisions.json)
                dump
                ((++r))
              done
            fi
          else
            log "solutionId $solutionId has no revisions"
          fi
        fi
        log "solutionId $solutionId does not match active=$active - skipping"
      fi
      ((++sol))
    done
  else
    find_version
    if [[ "$revisionId" != "" ]]; then
      dump
    fi
  fi
  log "Downloaded model packages"
  ls /tmp/acumos
  cd $WORK_DIR
fi
