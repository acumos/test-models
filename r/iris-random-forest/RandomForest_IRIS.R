# ===============LICENSE_START=======================================================
# Acumos Apache-2.0
# ===================================================================================
# Copyright (C) 2019 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
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

# This file is an example to explain how to onboard a machine learning model created in R into Acumos.
# The model created here is the famous IRIS predictive model built with Random forest algorithm.

# You need to have protobuf 3 installed on your system (version 2 will not work)
# please follow the procedure once for all 
#
# git clone https://github.com/google/protobuf.git protobuf
# cd protobuf
# ./autogen.sh
# ./configure --prefix=`pwd`/../`uname -m`-linux-gnu
# make
# make install

# Dependencies : feel free to comment those that are already installed in your local R environement
install.packages(randomForest)
library(randomForest)

install.packages(c("Rcpp","RCurl","RUnit","rmarkdown","knitr","pinp","xml2"))
library(Rcpp,Rcurl,RUnit,rmarkdown,knitr,pinp)

install.packages("RProtoBuf")
install.packages("acumos", repos=c("http://cloud.r-project.org","http://rforge.net"), dep=T)

# create the model bundle
acumos::compose(predict=function(..., inputs=lapply(iris[-5], class)) print(as.character(predict(rf, as.data.frame(list(...))))),
        aux = list(rf = randomForest(Species ~ ., data=iris)),name="The_model_name_you_want", file="the_model_bundle_file_name_you_want.amc")

# on-board the model bundle
acumos::push("push_URL","location_of_the_model_bundle_file","your_acumos_login:API_token")

# push_URL can be found in Acumos portal, in the ON-BOARDING MODEL page.
# API_token can be found in Acumos portal, in the settings of your acumos account.
