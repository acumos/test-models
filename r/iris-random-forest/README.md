# IRIS Model

This directory holds a demonstration model for Acumos.  The model is
built using R, and is the famous IRIS classifier.  This supports
testing and deployment activities.


## Building the model

Prerequisites for building the model:

 * R version ? or later
 * R module acumos (install via ?)

Build the model by running this command:

    ?

The script serializes the model to disk, then creates a bundle
suitable for onboarding to Acumos.  A sample session follows::

   [ put commands and output here ]

## On-boarding the model

On-board this model to an Acumos instance using the web-onboarding
feature, which accepts the bundle zip file created here. As part of
on-boarding the model is wrapped inside a model-runner service, which
in turn is dockerized (a docker image is created).


## Running the model

Prerequisites for running the model:

 * Docker software is running (images can be pulled and started)
 * curl command-line tool
 * protoc command-line tool, version 3.4 or later

First download the docker tar file from the Acumos site, then import
("docker load") the downloaded tar file to create an image.  A sample
session follows::

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


Next start the image as a new Docker container with an argument to
map the port where the model runner micro service listens (3330) on
the host. A sample session follows::

    docker run -p3330:3330 -d e889
    9b7e801c65284d8bb8ef1db8ff6fea256ee1a25a3161504a73c31293399f42b8


### Data for the model

This model accepts a simple string message and echoes back its input.
The protocol buffer definition is in file "loopback.proto" included here.
Two versions of a sample message are provided:

 * protoc mark-up text format, in file hello-world-msg.txt
 * binary format, in file hello-world-msg.bin

The protoc mark-up text format uses "tag: value" entries, and braces to contain nested message types.
A simple example (with no nested message) follows here::

    s: "Hello, world."

The protoc command can be used to encode text in this format to binary format that is
sent to the model, and decode a binary response back to the same text format.
These operations are performed by the included test shell script.


### Posting data to the model

Use the included shell script to send data to the model, and it will
be echoed back.  This confirms the deployment is working as expected.
A sample session follows::

	$ ./test-model.sh hello-world-msg.txt
	./test-model.sh config: host=localhost, port=3330
	./test-model.sh config: protocol buffer definition file=loopback.proto, package=simplepackage
	./test-model.sh config: input message=SimpleMessage, output message=SimpleMessage, endpoint=loopback
	./test-model.sh config: POST data URL=http://localhost:3330/loopback
	./test-model.sh input: file=hello-world-msg.txt
	*   Trying ::1...
	* Connected to localhost (::1) port 3330 (#0)
	> POST /loopback HTTP/1.1
	> Host: localhost:3330
	> User-Agent: curl/7.47.0
	> Accept: */*
	> Content-Type: application/protobuf
	> Content-Length: 15
	>
	} [15 bytes data]
	* upload completely sent off: 15 out of 15 bytes
	< HTTP/1.1 201 CREATED
	< Server: gunicorn/19.9.0
	< Date: Mon, 08 Oct 2018 12:12:54 GMT
	< Connection: close
	< Content-Type: text/plain;charset=UTF-8
	< Content-Length: 15
	< Access-Control-Allow-Origin: *
	<
	{ [15 bytes data]
	* Closing connection 0
	s: "Hello, world."


## License

Copyright (C) 2019 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
Acumos is distributed by AT&T and Tech Mahindra under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied.  See the License for the specific language governing permissions and limitations
under the License.
