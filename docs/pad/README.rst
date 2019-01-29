.. ===============LICENSE_START=======================================================
.. Acumos CC-BY-4.0
.. ===================================================================================
.. Copyright (C) 2017-2019 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
.. ===================================================================================
.. This Acumos documentation file is distributed by AT&T and Tech Mahindra
.. under the Creative Commons Attribution 4.0 International License (the "License");
.. you may not use this file except in compliance with the License.
.. You may obtain a copy of the License at
..
..      http://creativecommons.org/licenses/by/4.0
..
.. This file is distributed on an "AS IS" BASIS,
.. WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
.. See the License for the specific language governing permissions and
.. limitations under the License.
.. ===============LICENSE_END=========================================================


.. _pad_usage:

===============================
Pipeline Application Demo (PAD)
===============================

The Pipeline Application Demo (PAD) demonstrates the linkage (and propagation) of models across instances.

The PAD was created as an interactive demonstration of model interaction with these features.

- *payload logs* for download of the binary payloads that are sent to (and received from) models as they are called
- *timing measurements* for round-trip latency (where avaialble) for a single model call and its response
- *opportunistic sample dropping* and indication of the current sample (best demonstrated in multi-sample assets, like videos) at different
  models in the pipeline.  The application will automatically drop new samples if a model is currently engaged
  in analysis.

.. image:: pad_example.jpg
    :alt: Sample execution of PAD with example asset
    :width: 200


Execution
---------

This application utilizes JSON data objects, so you'll need to access it from an HTTP or HTTPS webserver 
instead of dropping it as a file into your browser (most browsers refuse to start with this method).  For that
purpose, the simple python script `simple-cors-http-server-python3.py` has been included in the project root 
directory.   A set of assets (with :ref:`_pad_copyright`) have also been included for demonstration purposes 
with this web application.  Version changes are tracked in the :ref:`_pad_release_notes`.


Configuration
=============

The web applcation is configured with a JSON file.  At the time of writing, this JSON file must be 
adjacent to web application and a default example is included in `assets/config/main.json`.


Pipelines
=========

Pipelines are collections of functionalies (provided by models), often to compile a single application. 
In this application demo, a pipeline is a user-defined construct that includes references to assets
and models that are to be visually avaiable in the main PAD interface. 

(More information to be provided)

Models
======

Models are running instances of different `Acumos <https://www.acumos.org/>`_ created model instances. The
uniform wrapping of model input, output, and endpoint specification allows the models to be interchangably
created and used in this application.

(More information to be provided)


