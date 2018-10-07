#!/bin/sh

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

# Runs python to dump a model then bundles it for web onboarding

dir=bundle-loopback/loopback
rm -fr $dir
echo "$0: Invoking python to create the model"
python loopback.py
echo "$0: Invoking zip to create the bundle"
file=bundle-loopback.zip
(cd $dir && zip ../../$file metadata.json model.proto model.zip)
echo "$0: Bundle contents:"
unzip -l $file
