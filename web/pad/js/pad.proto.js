/*
# ===============LICENSE_START=======================================================
# Acumos Apache-2.0
# ===================================================================================
# Copyright (C) 2017-2019 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
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
# ===============LICENSE_END=========================================================# 
*/

/**
 pad.proto.js - angular backend for proto operations in PAD
*/

function ProtoControl($scope, options, $timeout)
{
    /////////////////////////////////////////////////////
    // private data
    var proto_refs = {};
    var post_headers = { "Content-type": "text/plain;charset=UTF-8" };   //defaults for headers
    
    /////////////////////////////////////////////////////
    // exposed functions


    // ----- diagnostic tool to download binary blobs ----
    $scope.fn.proto_download = function(proto_name, input_type) {
        if (!(proto_name in proto_refs) || !(input_type in proto_refs[proto_name] && input_type!='ref')) {
            $scope.fn.alert_create("Requested protobuf ('"+proto_name+", "+input_type+"') not available...", 'danger');
        }
        if (input_type != 'ref') {
            var typeName = proto_refs[proto_name][input_type+"_name"];
            return downloadBlob(proto_refs[proto_name][input_type], "protobuf."+typeName+".bin");
        }
            
        var proto_path = proto_refs[proto_name]['path'];
        protobuf.util.fetch(proto_path, {binary:true}, function(statusStr, data) {
            var fileName = proto_path.split(/[\\\/]/);       // added 7/11/18 for proto context
            fileName = fileName[fileName.length - 1];
            return downloadBlob(data, fileName, "text/plain");
        });
    }

    $scope.fn.protobuf_load = function(proto_name, proto_path, method_select, fn_success) {
        //console.log(proto_path);
        protobuf.load(proto_path, function(err, root) {
            if (err) {
                $scope.fn.alert_create("[protobuf]: Error!: "+err);
                throw err;
            }
            num_method = 0;
            $.each(root.nested, function(namePackage, objPackage) {    // walk all
                if ('Model' in objPackage && 'methods' in objPackage.Model) {    // walk to model and functions...
                    var typeSummary = {'root':root, 'methods':{}, 'path':proto_path, 'primary':method_select, 'package':namePackage };
                    var fileBase = proto_path.split(/[\\\/]/);       // added 7/11/18 for proto context
                    fileBase = fileBase[fileBase.length - 1];
                    //var domGroup = $("<optgroup label='"+fileBase+" - "+namePackage+"' >");
                    $.each(objPackage.Model.methods, function(nameMethod, objMethod) {  // walk methods
                        typeSummary['methods'][nameMethod] = {};
                        typeSummary['methods'][nameMethod]['typeIn'] = namePackage+'.'+objMethod.requestType;
                        typeSummary['methods'][nameMethod]['typeOut'] = namePackage+'.'+objMethod.responseType;
                        typeSummary['methods'][nameMethod]['service'] = namePackage+'.'+nameMethod;
                        num_method++;
                    });
                    proto_refs[proto_name] = typeSummary;
                }
            });
            graph_prepare(proto_name);
            console.log("[protobuf]: Load successful, found "+num_method+" methods for '"
                        +proto_name+"' (source: "+proto_path+").");
            if (fn_success) fn_success();
        });
    }

    // call this function to send data downstream (it should already be encoded)
    $scope.fn.proto_propagate = function (proto_name, sample_idx, sample_data) {
        // lookup details for this proto name
        var data_blob = null;
        var num_downstream = 0;
        $.each($scope.results[proto_name].source_downstream, function(i, k){
            // proceed to call this item if it is not blocked
            if ($scope.results[k].enabled && !$scope.results[k].blocked) {
                if (!(k in proto_refs)) {
                    if (sample_idx < 1)     //too much noise!
                        $scope.fn.alert_create("Proto propagate, unknown type '"+k+"'", 'danger');
                    return false;
                }
                // no sample data? just assume it's a raw image/vancas input (for now!?)
                if (!sample_data) {
                    //TODO: modify so that this just takes canvas URL references instead of pulling a copy each time
                    if (data_blob==null) {      //just do this once!
                        var data_url = $scope.fn.canvas_data(sample_idx);
                        data_blob = dataURItoBlob(data_url, true);
                    }
        
                    // fields from .proto file at time of writing...
                    // message Image {
                    //   string mime_type = 1;
                    //   bytes image_binary = 2;
                    // }
        
                    //TODO: should we always assume this is input? answer: for now, YES, always image input!
                    var inputPayload = { "mimeType": data_blob.type, "imageBinary": data_blob.bytes };
        
                    // ---- method for processing from a type ----
                    var proto_method = proto_refs[k]['primary'];
                    var msgInput = proto_refs[k]['root'].lookupType(proto_refs[k]['methods'][proto_method]['typeIn']);
                    // Verify the payload if necessary (i.e. when possibly incomplete or invalid)
                    var errMsg = msgInput.verify(inputPayload);
                    if (errMsg) {
                        var strErr = "[doPostImage]: Error during type verify for object input into protobuf method. ("+errMsg+")";
                        $scope.fn.alert_create(strErr, 'danger');
                        console.log(strErr);
                        //TODO: update with error string in results?
                        throw Error(strErr);
                    }
                    // Create a new message
                    var msgTransmit = msgInput.create(inputPayload);
                    // Encode a message to an Uint8Array (browser) or Buffer (node)
                    sample_data = msgInput.encode(msgTransmit).finish();
                }
                
                // call the child, pass callback as processing receipt + propagate
                $scope.fn.data_post(k, sample_idx, sample_data);
                num_downstream++;
            }
        });
        return (num_downstream>0);
    }
    

    // send encoded data (or allow legacy image data) 
    $scope.fn.data_post = function (model_name, sample_idx, sendPayload) {
        if (!sample_idx) sample_idx = 0;

        var url_attempt = $scope.config_user["Root Server"];
        var local_headers = $.extend({}, post_headers);       //rewrite with defaults
        if ($scope.results[model_name].stats.error) return false; // had an error with this function

        //console.log("[doPostImage]: Selected method ... '"+typeInput+"'");
        if (model_name in proto_refs) {     //valid protobuf type?; legacy check for direct HTTP post
            if ($scope.results[model_name].stats.waiting != null) {
                // console.log(model_name+": dropping sample "+sample_idx+" while waiting...");
                $scope.results[model_name].stats.dropped++;
                return;
            }
            $scope.results[model_name].stats.waiting = new Date();    //poke processing time for this item
            if (!sendPayload) {
                $scope.fn.alert_create("data_post expects valid payload in proto mode", 'danger');
            }

            //downloadBlob(sendPayload, 'protobuf.bin', 'application/octet-stream');
            // NOTE: TO TEST THIS BINARY BLOB, use some command-line magic like this...
            //  protoc --decode=mMJuVapnmIbrHlZGKyuuPDXsrkzpGqcr.FaceImage model.proto < protobuf.bin
            var proto_method = proto_refs[model_name]['primary'];
            proto_refs[model_name]["in_name"] = proto_refs[model_name]['methods'][proto_method]['typeIn'];
            proto_refs[model_name]["out_name"] = proto_refs[model_name]['methods'][proto_method]['typeOut'];
            proto_cache(sendPayload, model_name, 'in');

            // TODO: better parsing for port and method?
            //update url attempt to have a port and the method name
            url_attempt += ":"+$scope.models[model_name].port+"/"+proto_method;

            //request.responseType = 'arraybuffer';
        }
        else {
            var data_blob = dataURItoBlob(data_url, false);
            sendPayload = new FormData();
            sendPayload.append("image_binary", data_blob);
            sendPayload.append("mime_type", data_blob.type);
            // do anything to url_attempt? 
        }

        $scope.fn.canvas_lock(sample_idx, model_name, 1);    //indicate that this model is using sample
        // console.log("Attempt url: "+url_attempt);

        $.ajax({
            type: 'POST',
            url: url_attempt,
            data: sendPayload,
            crossDomain: true,
            dataType: 'native',
            xhrFields: {
                responseType: 'arraybuffer'
            },
            processData: false,
            headers: local_headers,
            error: function (data, textStatus, errorThrown) {
                //console.log(textStatus);
                if (textStatus=="error") {
                    textStatus += " (Was the transform URL valid? Was the right method selected?) ";
                }
                var errStr = "Error: Failed javascript POST (err: "+textStatus+", "+errorThrown+")";
                $scope.fn.alert_create(errStr, 'warning');
                $scope.fn.ingest_results(model_name, sample_idx, null, errStr);
                $scope.fn.canvas_lock(sample_idx, model_name, 0);    //indicate that this model is displaying sample
                $scope.results[model_name].stats.error = true;
                return false;
            },
            success: function(data, textStatus, jqXHR) {
                // first, decode to JSON
                proto_cache(data, model_name, 'out');       //save raw output as binary chunk
                var data_proc = data_process(data, model_name);

                // ingest in GUI and other processing
                var return_status = $scope.fn.ingest_results(model_name, sample_idx, data_proc[0], null, data_proc[1]);
                // recurse to call downstream, note data is encoded proto!
                if (return_status) {
                    $scope.fn.proto_propagate(model_name, sample_idx, proto_refs[model_name]['out']);
                }
                $scope.fn.canvas_lock(sample_idx, model_name, 0);    //indicate that this model is displaying sample
                return return_status;
            }
        });
    }

    /////////////////////////////////////////////////////
    // helper functions

    //attempt to process raw data, return array [0]=parsed data, [1]=valid fields
    function data_process(data, model_name) {
        var objOutput = [null, null];       // [actual data, valid fields (array) ]
        if (model_name in proto_refs) {     //valid protobuf type?
            var bodyEncodedInString = new Uint8Array(data);
            
            //console.log(typeof(data));
            //console.log(typeof(bodyEncodedInString));
            //console.log(bodyEncodedInString);

            // ---- method for processing from a type ----
            var proto_method = proto_refs[model_name]['primary'];
            var output_method = proto_refs[model_name]['methods'][proto_method]['typeOut'];
            var msgOutput = proto_refs[model_name]['root'].lookupType(output_method);
            try {
                var obj_result = msgOutput.decode(bodyEncodedInString);
                var field_names = [];    // string based field names

                // NOTE: this code expects one top-level item to be an array of nested results
                //  e.g.   Image{mime_type, image_binary}
                //  e.g.   DetectionFrameSet [ DetectionFrame{x, y, ...., mime_type, image_binary}, .... ]

                //try to crawl the fields in the protobuf....
                var nameRepeated = null;
                $.each(msgOutput.fields, function(name, val) {           //collect field names
                    if (val.repeated) {     //indicates it's a repeated field (likely an array)
                        nameRepeated = name;      //save this as last repeated field (ideally there is just one)
                    }
                });

                // lookup the nested type from the absolute package name
                var typeNested = msgOutput.name;
                if (nameRepeated) {
                    typeNested = msgOutput.fields[nameRepeated].type;
                    obj_result = obj_result[nameRepeated];  // dereference neseted object
                }
                else {
                    obj_result = [obj_result];    // simple singleton wrapper for uniform code below
                }                

                objOutput = [obj_result, typeNested];
            }
            catch(err) {
                var errStr = "Error: Failed to parse protobuf response, was the right method chosen? (err: "+err.message+")";
                $scope.fn.alert_create(errStr, 'warning');
            }
            //console.log(msgOutput);
            // console.log(objOutput);     //log parsed objects to console
        }
        else {
            objOutput[0] = $.parseJSON(data);
        }
        return objOutput;
    }

    // save data for a protobuf call to memory 
    function proto_cache(proto_data, proto_name, input_type) {
        if (!(proto_name in proto_refs))
            proto_refs[proto_name] = {};
        proto_refs[proto_name][input_type] = proto_data;    //input_type = in, out, ref
        $scope.results[proto_name].stats['has_'+input_type] = true;
    }

    /**
     * convert base64/URLEncoded data component to raw binary data held in a string
     *
     * Stoive, http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
     */
    function dataURItoBlob(dataURI, wantBytes) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        //added for returning bytes directly
        if (wantBytes) {
            return {'bytes':ia, 'type':mimeString};
        }
        return new Blob([ia], {type:mimeString});
    }

    //  https://stackoverflow.com/a/33622881
    function downloadBlob(data, fileName, mimeType) {
        //if there is no data, filename, or mime provided, make our own
        if (!data) return;
        if (!fileName)
            fileName = "protobuf.bin";
        if (!mimeType)
            mimeType = "application/octet-stream";

        var blob, url;
        blob = new Blob([data], {
            type: mimeType
        });
        url = window.URL.createObjectURL(blob);
        downloadURL(url, fileName, mimeType);
        setTimeout(function() {
            return window.URL.revokeObjectURL(url);
        }, 1000);
    };

    function downloadURL(data, fileName) {
        var a;
        a = document.createElement('a');
        a.href = data;
        a.download = fileName;
        document.body.appendChild(a);
        a.style = 'display: none';
        a.click();
        a.remove();
    };

    /////////////////////////////////////////////////////
    // helper functions - graph visualization

    // method to create graph helpers for interactive plotting
    function graph_prepare(proto_name) {        
        /*
        TOOD: future addition examples from visualization of node connectivity
        var imgnodes = { "nodes":[ 
                    { "name": "Transcode" },
                    { "name": "Content Based Sampling" },
                    { "name": "Image Classification" },
                    { "name": "Face Detection" },
                    { "name": "Tags" },
                    { "name": "Key Frames", "class": "NodeStorage" },
                    {
                        "name": "Video",
                        "class": "Client",
                        "label": "Video",
                        "start": 0,
                        "state": "off",
                        "id": 0,
                        "size": "small"
                    },
                    {
                        "name": "Source",
                        "class": "Attached Volume",
                        "label": "Vol5",
                        "start": 1,
                        "state": "off",
                        "id": 26,
                        "size": "25GB"
                    }
            ],
                "links":[
            { "sourcename": "Source", "targetname": "Video","type":"Video" },
            { "sourcename": "Video", "targetname": "Content Based Sampling" ,"type":"Video"},
            { "sourcename": "Content Based Sampling", "targetname": "Key Frames","type":"Image" },
            { "sourcename": "Key Frames", "targetname": "Image Classification","type":"Image" },
            { "sourcename": "Key Frames", "targetname": "Face Detection" ,"type":"Image"},
            { "sourcename": "Image Classification", "targetname": "Tags","type":"Image" },
            { "sourcename": "Face Detection", "targetname": "Tags","type":"Image" },
            { "sourcename": "Source", "targetname": "Transcode" ,"type":"Video"}
            ]
        };
        */
    }


    function init() {
        $scope.proto = {};      // similar to $scope.stats
    }


    /////////////////////////////////////////////////////
    //private initialization
    init();

};

