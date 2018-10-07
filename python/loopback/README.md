# Loopback Model

This directory holds a simple demonstration model for Acumos.  The model uses Python
to echo back the arguments provided.  This supports testing, deployment and other
development activities.


## Building the model

Prerequisites for building the model:

 * Python version 3.4 or later 
 * Python module acumos (install via "pip install acumos")

Build the model by running the included shell script::

    create-loopback-bundle.sh

This serializes the model to disk, then creates a bundle suitable for onboarding to Acumos.
Sample session follows::

    $ ./create-loopback-bundle.sh 
    ./create-loopback-bundle.sh: Invoking python to create the model
    Acumos version is 0.6.4
    model function says hi
    dumping model to subdir bundle-loopback
    ./create-loopback-bundle.sh: Invoking zip to create the bundle
    updating: metadata.json (deflated 47%)
    updating: model.proto (deflated 20%)
    updating: model.zip (stored 0%)
    ./create-loopback-bundle.sh: Bundle contents:
    Archive:  bundle-loopback.zip
          Length      Date    Time    Name
    ---------  ---------- -----   ----
          441  10-07-2018 07:13   metadata.json
          178  10-07-2018 07:13   model.proto
         2453  10-07-2018 07:13   model.zip
    ---------                     -------
         3072                     3 files


## On-boarding the model

On-board this model to an Acumos instance using the web-onboarding feature, which accepts
the bundle zip file created here. As part of on-boarding the model is wrapped inside a
model-runner service, which in turn is dockerized (a docker image is created).


## Running the model

Prerequisites for running the model:

 * Docker software is running (images can be pulled and started)
 * curl command-line tool
 * protoc command-line tool, version 3.4 or later 

Download the docker image from the Acumos site, import the tar file to create an image,
then start the image as a new container. No arguments are needed, but optionally the
container can be configured so that a different external port can be mapped to the
internal port 8336 where the model listens.


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

Use the included shell script to test the model by sending it data that will be echoed back. 
A sample session is shown here::

    $ ./test-model.sh hello-world-msg.txt 
    ./test-model.sh config: host=localhost, port=8336
    ./test-model.sh config: protocol buffer definition file=loopback.proto, package=simplepackage
    ./test-model.sh config: input message=SimpleMessage, output message=SimpleMessage, endpoint=loopback
    ./test-model.sh config: POST data URL=http://localhost:8336/modelrunner/loopback
    ./test-model.sh input: file=hello-world-msg.txt
    *   Trying 127.0.0.1...
    s: "Hello, world."


## License

Copyright (C) 2018 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
Acumos is distributed by AT&T and Tech Mahindra under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either 
express or implied.  See the License for the specific language governing permissions and limitations 
under the License.
