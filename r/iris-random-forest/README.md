# IRIS Model

This directory holds a demonstration model for Acumos.  The model is
built using R, and is the famous IRIS classifier.  This supports
testing and deployment activities.


## Building the model

Prerequisites for building the model:

 * R version : higher or equal to 3.0.0

 * acumos R package to install :
 
install.packages("acumos", repos=c("http://cloud.r-project.org","http://rforge.net"), dep=T)

 * The following R packages must be installed

install.packages(randomForest)
library(randomForest)

install.packages(c("Rcpp","RCurl","RUnit","rmarkdown","knitr","pinp","xml2"))
library(Rcpp,Rcurl,RUnit,rmarkdown,knitr,pinp)

install.packages("RProtoBuf")

Build the model by running this command:

acumos::compose(predict=function(..., inputs=lapply(iris[-5], class))
		print(as.character(predict(rf, as.data.frame(list(...))))),
        	aux = list(rf = randomForest(Species ~ ., data=iris)),
                name="the_model_name_you_want", file="the_model_bundle_file_name_you_want.amc")

The script serializes the model to disk, then creates a model bundle (.amc file) suitable for onboarding
to Acumos. The model bundle, (.amc file) is in fact a ZIP file with meta.json defining the component and
its metadata, component.bin the binary payload and component.proto with the protobuf specs.

## On-boarding the model

You can On-board this model bundle to an Acumos instance using the web-onboarding feature by drag
and drop it to the Acumos ON-BOARDING MODEL page. Or you can use the push function like that

acumos::push("push_URL","location_of_the_model_bundle_file","your_acumos_login:API_token")

push_URL can be found in Acumos portal, in the ON-BOARDING MODEL page.
API_token can be found in Acumos portal, in the settings of your acumos account.

## Running the model

Prerequisites for running the model:

 * Docker software is running (images can be pulled and started)
 * curl command-line tool
 * protoc command-line tool, version 3.4 or later

First download the docker tar file from the Acumos site, then import ("docker load") the downloaded
tar file to create an image.  A sample session follows::

	$ docker load -i loopback_e3356398-3038-4a89-83e6-8a2139d65501_1.tar
	43efe85a991c: Loading layer [==================================================>]  82.94MB/82.94MB
	59a5ed91aa75: Loading layer [==================================================>]   7.85MB/7.85MB
	ba3f02ba0d41: Loading layer [==================================================>]  64.06MB/64.06MB
	27eba76928b5: Loading layer [==================================================>]  4.608kB/4.608kB
	f37f0fd2e625: Loading layer [==================================================>]  7.754MB/7.754MB
	842acd08ee57: Loading layer [==================================================>]  1.536kB/1.536kB
	693324de1114: Loading layer [==================================================>]  111.6kB/111.6kB
	f4f7a5ba5e57: Loading layer [==================================================>]  321.7MB/321.7MB
	97f7abd1b39a: Loading layer [==================================================>]  724.4MB/724.4MB
	Loaded image: nexus.acumos.org:18002/loopback_e3356398-3038-4a89-83e6-8a2139d65501:1
	$ docker images
	REPOSITORY                                                                   TAG                 IMAGE ID            CREATED             SIZE
	nexus.acumos.org:18002/loopback_e3356398-3038-4a89-83e6-8a2139d65501   1                   e88905b2ac4e        25 hours ago        1.18GB


Next start the image as a new Docker container with an argument to map the port where the model
runner micro service listens (3330) on the host.

A sample session follows::

    docker run -p3330:3330 -d e889
    9b7e801c65284d8bb8ef1db8ff6fea256ee1a25a3161504a73c31293399f42b8


### Data for the model



### Posting data to the model



## License

Copyright (C) 2019 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
Acumos is distributed by AT&T and Tech Mahindra under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied.  See the License for the specific language governing permissions and limitations
under the License.
