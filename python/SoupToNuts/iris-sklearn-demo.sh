#!/bin/bash
# ===============LICENSE_START=======================================================
# Acumos Apache-2.0
# ===================================================================================
# Copyright (C) 2017-2018 AT&T Intellectual Property. All rights reserved.
# ===================================================================================
# This Acumos software file is distributed by AT&T
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
# What this is:
# - Demo of Acumos model python development environment setup for scikit-learn
# Prerequisites:
# - Ubuntu Xenial or Centos 7 server
# - docker-ce installed, e.g. per https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/
# Usage:
#   source iris-sklearn-demo.sh
# - Invoke this script from a folder where you want to:
#   - Clone the Acumos test-models repo
#   - Have the iris_sklearn model packaged in iris_sklearn.zip for upload to
#     the Acumos platform
# - During installation of the prerequisites, you will need to respond to
#   various prompts, which should be self-explanatory:
#     read and accept the Anaconda3 terms of use: enter 'yes' 
#     Anaconda3 install location: accept the default ~/anaconda3
#     Prepend Anaconda3 install location to PATH: no (done in this script)
#     Install MS VSCode: enter yes or no (not used in this demo)
#     Virtualenv location: accept default (y)
#     Update conda packages: y
#     Install new packages: y
#     Update packages: y
#
WORKDIR=$PWD
echo "Downloading anaconda3"
rm -rf ~/anaconda3
rm Anaconda3-5.1.0-Linux-x86_64.sh
wget https://repo.anaconda.com/archive/Anaconda3-5.1.0-Linux-x86_64.sh

echo "Installing anaconda3"
bash Anaconda3-5.1.0-Linux-x86_64.sh
if [[ $(grep -c anaconda3 ~/.bashrc) -eq 0 ]]; then
  echo "export PATH=\$PATH:/home/$USER/anaconda3/bin" >>~/.bashrc
fi
export PATH=$PATH:/home/$USER/anaconda3/bin

echo "Creating virtualenv 'acumos' under ~/anaconda3"
conda create -y --name acumos 
source activate acumos

echo "Updating anaconda3"
conda update -y -n base conda

echo "Installing pandas"
conda install -y pandas

echo "Installing libprotobuf"
conda install -y -c anaconda libprotobuf

echo "Installing scikit-learn"
conda install -y scikit-learn

echo "Installing cython"
pip install cython

echo "Installing acumos python library"
pip install acumos

echo "Cloning the acumos test-models repo"
rm -rf test-models
git clone https://gerrit.acumos.org/r/test-models

echo "Customizing iris_sklearn.py"
cd t*/SoupToNuts
sed -i -- "s~/Users/guy/Desktop~$WORKDIR/iris_sklearn~" iris_sklearn.py

echo "Generating model package data"
rm $WORKDIR/iris_sklearn/*
python iris_sklearn.py

echo "Creating the model package"
cd $WORKDIR/iris_sklearn
zip $WORKDIR/iris_sklearn.zip *
cd $WORKDIR
ls
echo "The packaged model is in file iris_sklearn.zip. You should now be able"
echo "to upload this to the Acumos platform using the 'ON-BOARDING BY WEB'"
echo "option under 'On-Boarding Model'"
